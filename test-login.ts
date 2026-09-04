
async function testLogin() {
  const res = await fetch('http://localhost:3001/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: 'village@milktrace.local', password: 'village1234' })
  });
  const data = await res.json();
  console.log(JSON.stringify(data, null, 2));
}
testLogin();
