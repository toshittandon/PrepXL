const TestDashboard = () => {
  console.log('TestDashboard component is rendering');
  
  // Add an alert to make sure this component is actually being called
  alert('TestDashboard component loaded!');
  
  return (
    <div style={{ 
      padding: '20px', 
      backgroundColor: 'lightblue', 
      minHeight: '100vh',
      fontSize: '24px',
      color: 'black'
    }}>
      <h1 style={{ color: 'red', fontSize: '48px' }}>TEST DASHBOARD IS WORKING</h1>
      <p style={{ fontSize: '20px' }}>If you see this, the routing is working</p>
      <p>Current URL: {window.location.href}</p>
    </div>
  );
};

export default TestDashboard;