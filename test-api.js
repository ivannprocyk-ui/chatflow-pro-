import axios from 'axios';

async function test() {
  try {
    console.log('Testing login...');
    const res = await axios.post('http://localhost:3001/api/auth/login', {
      email: 'demo@pizzeria.com',
      password: 'demo123'
    });
    console.log('SUCCESS:', res.status);
    console.log('Has token:', !!res.data.accessToken);
  } catch (err) {
    console.error('LOGIN ERROR:', err.response?.status, err.response?.data || err.message);
  }

  try {
    console.log('\nTesting register...');
    const res = await axios.post('http://localhost:3001/api/auth/register', {
      email: 'testnode' + Date.now() + '@test.com',
      password: 'test123',
      organizationName: 'Test Company'
    });
    console.log('SUCCESS:', res.status);
    console.log('Has token:', !!res.data.accessToken);
  } catch (err) {
    console.error('REGISTER ERROR:', err.response?.status, err.response?.data || err.message);
  }
}

test();
