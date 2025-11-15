import { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { CRMFieldConfig, CRMConfig } from '@/react-app/utils/storage';

interface ImportWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (contacts: any[]) => void;
  config: CRMConfig;
}

interface ColumnMapping {
  excelColumn: string;
  crmField: string;
}

interface ValidationError {
  row: number;
  field: string;
  value: any;
  error: string;
}

type WizardStep = 'upload' | 'preview' | 'mapping' | 'validation' | 'import';

export default function ImportWizard({ isOpen, onClose, onImport, config }: ImportWizardProps) {
  const [currentStep, setCurrentStep] = useState<WizardStep>('upload');
  const [rawData, setRawData] = useState<any[]>([]);
  const [excelColumns, setExcelColumns] = useState<string[]>([]);
  const [columnMappings, setColumnMappings] = useState<ColumnMapping[]>([]);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = event.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { raw: false });

        if (jsonData.length === 0) {
          alert('El archivo está vacío');
          return;
        }

        // Extract column names from first row
        const columns = Object.keys(jsonData[0] as object);

        setRawData(jsonData as any[]);
        setExcelColumns(columns);

        // Auto-detect mappings
        autoDetectMappings(columns);

        setCurrentStep('preview');
      } catch (error) {
        console.error('Error reading file:', error);
        alert('Error al leer el archivo. Asegúrate de que sea un archivo Excel válido.');
      }
    };
    reader.readAsBinaryString(file);
  };

  const autoDetectMappings = (columns: string[]) => {
    const mappings: ColumnMapping[] = [];

    columns.forEach(col => {
      const colLower = col.toLowerCase().trim();

      // Try to find matching CRM field
      const matchedField = config.fields.find(field => {
        const fieldLower = field.name.toLowerCase();
        const labelLower = field.label.toLowerCase();

        return colLower === fieldLower ||
               colLower === labelLower ||
               colLower.includes(fieldLower) ||
               fieldLower.includes(colLower);
      });

      if (matchedField) {
        mappings.push({
          excelColumn: col,
          crmField: matchedField.name
        });
      } else {
        mappings.push({
          excelColumn: col,
          crmField: '' // Not mapped
        });
      }
    });

    setColumnMappings(mappings);
  };

  const updateMapping = (excelColumn: string, crmField: string) => {
    setColumnMappings(prev =>
      prev.map(m =>
        m.excelColumn === excelColumn
          ? { ...m, crmField }
          : m
      )
    );
  };

  const validateData = () => {
    setIsProcessing(true);
    const errors: ValidationError[] = [];

    rawData.forEach((row, index) => {
      columnMappings.forEach(mapping => {
        if (!mapping.crmField) return;

        const field = config.fields.find(f => f.name === mapping.crmField);
        if (!field) return;

        const value = row[mapping.excelColumn];

        // Required field validation
        if (field.required && (!value || value.toString().trim() === '')) {
          errors.push({
            row: index + 2, // +2 because row 1 is header, array is 0-indexed
            field: field.label,
            value: value,
            error: 'Campo requerido vacío'
          });
        }

        // Type-specific validation
        if (value) {
          if (field.type === 'email') {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(value.toString())) {
              errors.push({
                row: index + 2,
                field: field.label,
                value: value,
                error: 'Formato de email inválido'
              });
            }
          }

          if (field.type === 'phone') {
            const cleanPhone = value.toString().replace(/[^0-9]/g, '');
            if (cleanPhone.length < 8) {
              errors.push({
                row: index + 2,
                field: field.label,
                value: value,
                error: 'Teléfono debe tener al menos 8 dígitos'
              });
            }
          }

          if (field.type === 'number' || field.type === 'currency') {
            if (isNaN(Number(value))) {
              errors.push({
                row: index + 2,
                field: field.label,
                value: value,
                error: 'Debe ser un número'
              });
            }
          }
        }
      });
    });

    setValidationErrors(errors);
    setIsProcessing(false);
    setCurrentStep('validation');
  };

  const executeImport = () => {
    setIsProcessing(true);

    const contacts = rawData.map(row => {
      const contact: any = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        createdAt: new Date().toISOString(),
        lastInteraction: new Date().toISOString(),
        messagesSent: 0,
        tags: [],
        status: config.statuses[0].name // Default status
      };

      // Map Excel columns to CRM fields
      columnMappings.forEach(mapping => {
        if (mapping.crmField && row[mapping.excelColumn] !== undefined) {
          const field = config.fields.find(f => f.name === mapping.crmField);
          let value = row[mapping.excelColumn];

          // Type conversion
          if (field) {
            if (field.type === 'number' || field.type === 'currency') {
              value = Number(value) || 0;
            } else if (field.type === 'date') {
              value = new Date(value).toISOString();
            } else if (field.type === 'phone') {
              value = value.toString().replace(/[^0-9+]/g, '');
            } else if (field.type === 'email') {
              value = value.toString().toLowerCase().trim();
            } else {
              value = value.toString().trim();
            }
          }

          contact[mapping.crmField] = value;
        }
      });

      return contact;
    });

    setTimeout(() => {
      onImport(contacts);
      resetWizard();
      setIsProcessing(false);
    }, 500);
  };

  const resetWizard = () => {
    setCurrentStep('upload');
    setRawData([]);
    setExcelColumns([]);
    setColumnMappings([]);
    setValidationErrors([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClose = () => {
    resetWizard();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
          onClick={handleClose}
        />

        {/* Modal */}
        <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white flex items-center">
                  <i className="fas fa-file-import mr-3"></i>
                  Importar Contactos
                </h2>
                <p className="text-white/80 text-sm mt-1">
                  Importa contactos desde un archivo Excel (.xlsx)
                </p>
              </div>
              <button
                onClick={handleClose}
                className="text-white/80 hover:text-white transition-colors"
              >
                <i className="fas fa-times text-2xl"></i>
              </button>
            </div>

            {/* Progress Steps */}
            <div className="mt-6 flex items-center justify-between">
              {[
                { key: 'upload', label: 'Subir', icon: 'fa-upload' },
                { key: 'preview', label: 'Vista Previa', icon: 'fa-eye' },
                { key: 'mapping', label: 'Mapeo', icon: 'fa-exchange-alt' },
                { key: 'validation', label: 'Validación', icon: 'fa-check-circle' },
                { key: 'import', label: 'Importar', icon: 'fa-download' }
              ].map((step, index) => (
                <div key={step.key} className="flex items-center flex-1">
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full transition-all ${
                    currentStep === step.key
                      ? 'bg-white text-blue-600 shadow-lg scale-110'
                      : ['preview', 'mapping', 'validation', 'import'].includes(currentStep) &&
                        ['upload', 'preview', 'mapping', 'validation'].slice(0, ['upload', 'preview', 'mapping', 'validation', 'import'].indexOf(currentStep)).includes(step.key as any)
                      ? 'bg-white/30 text-white'
                      : 'bg-white/20 text-white/60'
                  }`}>
                    <i className={`fas ${step.icon}`}></i>
                  </div>
                  {index < 4 && (
                    <div className={`flex-1 h-1 mx-2 rounded transition-colors ${
                      ['preview', 'mapping', 'validation', 'import'].includes(currentStep) &&
                      index < ['upload', 'preview', 'mapping', 'validation', 'import'].indexOf(currentStep)
                        ? 'bg-white/30'
                        : 'bg-white/10'
                    }`} />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Body */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
            {/* Step 1: Upload */}
            {currentStep === 'upload' && (
              <div className="text-center py-12">
                <div className="mb-6">
                  <i className="fas fa-file-excel text-6xl text-emerald-500"></i>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  Selecciona un archivo Excel
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Soportamos archivos .xlsx con contactos. La primera fila debe contener los nombres de las columnas.
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:shadow-lg transition-all inline-flex items-center space-x-2"
                >
                  <i className="fas fa-upload"></i>
                  <span>Seleccionar Archivo</span>
                </button>
              </div>
            )}

            {/* Step 2: Preview */}
            {currentStep === 'preview' && (
              <div>
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      Vista Previa de Datos
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {rawData.length} filas encontradas
                    </p>
                  </div>
                </div>

                <div className="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-lg">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        {excelColumns.map((col, index) => (
                          <th key={index} className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {rawData.slice(0, 5).map((row, rowIndex) => (
                        <tr key={rowIndex}>
                          {excelColumns.map((col, colIndex) => (
                            <td key={colIndex} className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                              {row[col] || '-'}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {rawData.length > 5 && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                    Mostrando las primeras 5 filas de {rawData.length}
                  </p>
                )}
              </div>
            )}

            {/* Step 3: Mapping */}
            {currentStep === 'mapping' && (
              <div>
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    Mapeo de Campos
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Relaciona las columnas de Excel con los campos del CRM
                  </p>
                </div>

                <div className="space-y-3">
                  {columnMappings.map((mapping, index) => (
                    <div key={index} className="flex items-center space-x-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="flex-1">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Columna Excel
                        </label>
                        <div className="mt-1 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100">
                          {mapping.excelColumn}
                        </div>
                      </div>

                      <div className="flex-shrink-0">
                        <i className="fas fa-arrow-right text-gray-400"></i>
                      </div>

                      <div className="flex-1">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Campo CRM
                        </label>
                        <select
                          value={mapping.crmField}
                          onChange={(e) => updateMapping(mapping.excelColumn, e.target.value)}
                          className="mt-1 w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">-- No mapear --</option>
                          {config.fields.map(field => (
                            <option key={field.name} value={field.name}>
                              {field.label} {field.required ? '*' : ''}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Step 4: Validation */}
            {currentStep === 'validation' && (
              <div>
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    Resultados de Validación
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {validationErrors.length === 0
                      ? '¡Todos los datos son válidos!'
                      : `Se encontraron ${validationErrors.length} errores`}
                  </p>
                </div>

                {validationErrors.length === 0 ? (
                  <div className="text-center py-12">
                    <i className="fas fa-check-circle text-6xl text-emerald-500 mb-4"></i>
                    <h4 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                      Validación Exitosa
                    </h4>
                    <p className="text-gray-600 dark:text-gray-400">
                      Todos los datos pasaron la validación. Puedes proceder con la importación.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {validationErrors.map((error, index) => (
                      <div key={index} className="flex items-start space-x-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                        <i className="fas fa-exclamation-circle text-red-600 dark:text-red-400 mt-0.5"></i>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-red-900 dark:text-red-100">
                            Fila {error.row} - {error.field}
                          </p>
                          <p className="text-sm text-red-700 dark:text-red-300">
                            {error.error}: "{error.value}"
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Step 5: Import */}
            {currentStep === 'import' && (
              <div className="text-center py-12">
                {isProcessing ? (
                  <>
                    <div className="mb-6">
                      <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                      Importando Contactos...
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      Por favor espera mientras procesamos los datos
                    </p>
                  </>
                ) : (
                  <>
                    <i className="fas fa-check-circle text-6xl text-emerald-500 mb-4"></i>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                      ¡Importación Completada!
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      {rawData.length} contactos importados exitosamente
                    </p>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-gray-50 dark:bg-gray-700 px-6 py-4 flex items-center justify-between">
            <button
              onClick={handleClose}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
            >
              {currentStep === 'import' ? 'Cerrar' : 'Cancelar'}
            </button>

            <div className="flex items-center space-x-3">
              {currentStep === 'preview' && (
                <button
                  onClick={() => setCurrentStep('mapping')}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  Continuar
                </button>
              )}

              {currentStep === 'mapping' && (
                <>
                  <button
                    onClick={() => setCurrentStep('preview')}
                    className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                  >
                    Atrás
                  </button>
                  <button
                    onClick={validateData}
                    disabled={isProcessing}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    Validar Datos
                  </button>
                </>
              )}

              {currentStep === 'validation' && (
                <>
                  <button
                    onClick={() => setCurrentStep('mapping')}
                    className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                  >
                    Atrás
                  </button>
                  <button
                    onClick={() => {
                      setCurrentStep('import');
                      executeImport();
                    }}
                    disabled={validationErrors.length > 0}
                    className="px-6 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {validationErrors.length > 0 ? 'Corrige los errores' : 'Importar Ahora'}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
