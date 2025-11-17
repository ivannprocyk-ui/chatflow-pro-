import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';

// Interfaces
export interface ConfiguracionFacturacion {
  logo?: string; // URL o base64
  nombre_empresa: string;
  direccion: string;
  ciudad: string;
  codigo_postal: string;
  pais: string;
  telefono: string;
  email: string;
  website: string;
  numero_registro?: string;
  terminos_condiciones: string;
  nota_pie: string;
  color_primario?: string;
  color_secundario?: string;
}

export interface FacturaData {
  numero_factura: string;
  fecha_emision: Date;
  fecha_vencimiento?: Date;
  cliente: {
    nombre: string;
    empresa: string;
    email: string;
    telefono?: string;
    direccion?: string;
  };
  items: {
    descripcion: string;
    cantidad: number;
    precio_unitario: number;
    subtotal: number;
  }[];
  subtotal: number;
  impuestos?: number;
  descuentos?: number;
  total: number;
  moneda: string;
  notas?: string;
}

// Estilos para el PDF
const createStyles = (config: ConfiguracionFacturacion) => StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: 'Helvetica',
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
    paddingBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: config.color_primario || '#3b82f6',
  },
  logoSection: {
    width: '50%',
  },
  logo: {
    width: 120,
    height: 60,
    objectFit: 'contain',
    marginBottom: 10,
  },
  companyInfo: {
    fontSize: 9,
    lineHeight: 1.4,
    color: '#4b5563',
  },
  companyName: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    color: '#111827',
    marginBottom: 5,
  },
  invoiceSection: {
    width: '50%',
    alignItems: 'flex-end',
  },
  invoiceTitle: {
    fontSize: 24,
    fontFamily: 'Helvetica-Bold',
    color: config.color_primario || '#3b82f6',
    marginBottom: 10,
  },
  invoiceNumber: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    color: '#111827',
    marginBottom: 5,
  },
  invoiceDate: {
    fontSize: 9,
    color: '#6b7280',
  },
  clientSection: {
    marginBottom: 30,
    padding: 15,
    backgroundColor: '#f9fafb',
    borderRadius: 5,
  },
  sectionTitle: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: config.color_primario || '#3b82f6',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  clientInfo: {
    fontSize: 9,
    lineHeight: 1.5,
    color: '#374151',
  },
  clientName: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    color: '#111827',
    marginBottom: 5,
  },
  table: {
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: config.color_primario || '#3b82f6',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 3,
  },
  tableHeaderText: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: '#ffffff',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  tableRowEven: {
    backgroundColor: '#f9fafb',
  },
  tableCell: {
    fontSize: 9,
    color: '#374151',
  },
  tableCellBold: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: '#111827',
  },
  // Anchos de columna
  colDescripcion: { width: '50%' },
  colCantidad: { width: '12%', textAlign: 'center' },
  colPrecio: { width: '19%', textAlign: 'right' },
  colTotal: { width: '19%', textAlign: 'right' },
  totalsSection: {
    marginTop: 10,
    marginLeft: 'auto',
    width: '40%',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  totalLabel: {
    fontSize: 10,
    color: '#6b7280',
  },
  totalValue: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: '#111827',
  },
  grandTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: config.color_primario || '#3b82f6',
    borderRadius: 3,
    marginTop: 5,
  },
  grandTotalLabel: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    color: '#ffffff',
  },
  grandTotalValue: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    color: '#ffffff',
  },
  notesSection: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#fef3c7',
    borderRadius: 5,
    borderLeftWidth: 3,
    borderLeftColor: '#f59e0b',
  },
  notesTitle: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: '#92400e',
    marginBottom: 5,
  },
  notesText: {
    fontSize: 9,
    color: '#78350f',
    lineHeight: 1.4,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  footerText: {
    fontSize: 8,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 1.5,
  },
  footerHighlight: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: '#ef4444',
    textAlign: 'center',
    marginBottom: 5,
  },
  disclaimer: {
    fontSize: 7,
    color: '#9ca3af',
    textAlign: 'center',
    marginTop: 10,
    fontStyle: 'italic',
  },
});

interface FacturaTemplateProps {
  factura: FacturaData;
  configuracion: ConfiguracionFacturacion;
}

export const FacturaTemplate: React.FC<FacturaTemplateProps> = ({ factura, configuracion }) => {
  const styles = createStyles(configuracion);

  const formatCurrency = (amount: number, moneda: string) => {
    return `${moneda === 'USD' ? '$' : moneda === 'EUR' ? '€' : '$'}${amount.toLocaleString('es-ES', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          {/* Logo y datos de la empresa emisora */}
          <View style={styles.logoSection}>
            {configuracion.logo && (
              <Image src={configuracion.logo} style={styles.logo} />
            )}
            <Text style={styles.companyName}>{configuracion.nombre_empresa}</Text>
            <Text style={styles.companyInfo}>{configuracion.direccion}</Text>
            <Text style={styles.companyInfo}>
              {configuracion.ciudad}, {configuracion.codigo_postal}, {configuracion.pais}
            </Text>
            <Text style={styles.companyInfo}>Tel: {configuracion.telefono}</Text>
            <Text style={styles.companyInfo}>Email: {configuracion.email}</Text>
            {configuracion.website && (
              <Text style={styles.companyInfo}>Web: {configuracion.website}</Text>
            )}
            {configuracion.numero_registro && (
              <Text style={styles.companyInfo}>Reg. Nº: {configuracion.numero_registro}</Text>
            )}
          </View>

          {/* Información de la factura */}
          <View style={styles.invoiceSection}>
            <Text style={styles.invoiceTitle}>FACTURA</Text>
            <Text style={styles.invoiceNumber}>Nº {factura.numero_factura}</Text>
            <Text style={styles.invoiceDate}>Fecha de emisión: {formatDate(factura.fecha_emision)}</Text>
            {factura.fecha_vencimiento && (
              <Text style={styles.invoiceDate}>Vencimiento: {formatDate(factura.fecha_vencimiento)}</Text>
            )}
          </View>
        </View>

        {/* Datos del cliente */}
        <View style={styles.clientSection}>
          <Text style={styles.sectionTitle}>Facturar a:</Text>
          <Text style={styles.clientName}>{factura.cliente.nombre}</Text>
          <Text style={styles.clientInfo}>{factura.cliente.empresa}</Text>
          <Text style={styles.clientInfo}>Email: {factura.cliente.email}</Text>
          {factura.cliente.telefono && (
            <Text style={styles.clientInfo}>Tel: {factura.cliente.telefono}</Text>
          )}
          {factura.cliente.direccion && (
            <Text style={styles.clientInfo}>{factura.cliente.direccion}</Text>
          )}
        </View>

        {/* Tabla de items */}
        <View style={styles.table}>
          {/* Header de tabla */}
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderText, styles.colDescripcion]}>Descripción</Text>
            <Text style={[styles.tableHeaderText, styles.colCantidad]}>Cant.</Text>
            <Text style={[styles.tableHeaderText, styles.colPrecio]}>Precio Unit.</Text>
            <Text style={[styles.tableHeaderText, styles.colTotal]}>Subtotal</Text>
          </View>

          {/* Filas de items */}
          {factura.items.map((item, index) => (
            <View
              key={index}
              style={[styles.tableRow, index % 2 === 1 ? styles.tableRowEven : {}]}
            >
              <Text style={[styles.tableCellBold, styles.colDescripcion]}>{item.descripcion}</Text>
              <Text style={[styles.tableCell, styles.colCantidad]}>{item.cantidad}</Text>
              <Text style={[styles.tableCell, styles.colPrecio]}>
                {formatCurrency(item.precio_unitario, factura.moneda)}
              </Text>
              <Text style={[styles.tableCellBold, styles.colTotal]}>
                {formatCurrency(item.subtotal, factura.moneda)}
              </Text>
            </View>
          ))}
        </View>

        {/* Totales */}
        <View style={styles.totalsSection}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal:</Text>
            <Text style={styles.totalValue}>{formatCurrency(factura.subtotal, factura.moneda)}</Text>
          </View>

          {factura.descuentos !== undefined && factura.descuentos > 0 && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Descuentos:</Text>
              <Text style={styles.totalValue}>-{formatCurrency(factura.descuentos, factura.moneda)}</Text>
            </View>
          )}

          {factura.impuestos !== undefined && factura.impuestos > 0 && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Impuestos:</Text>
              <Text style={styles.totalValue}>{formatCurrency(factura.impuestos, factura.moneda)}</Text>
            </View>
          )}

          <View style={styles.grandTotalRow}>
            <Text style={styles.grandTotalLabel}>TOTAL:</Text>
            <Text style={styles.grandTotalValue}>{formatCurrency(factura.total, factura.moneda)}</Text>
          </View>
        </View>

        {/* Notas */}
        {factura.notas && (
          <View style={styles.notesSection}>
            <Text style={styles.notesTitle}>Notas:</Text>
            <Text style={styles.notesText}>{factura.notas}</Text>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerHighlight}>{configuracion.terminos_condiciones}</Text>
          <Text style={styles.footerText}>{configuracion.nota_pie}</Text>
          <Text style={styles.disclaimer}>
            Este documento ha sido generado electrónicamente y es válido sin firma.
          </Text>
        </View>
      </Page>
    </Document>
  );
};

export default FacturaTemplate;
