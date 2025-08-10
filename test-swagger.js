const fetch = require('node-fetch');

async function testSwaggerDocs() {
  try {
    console.log('Testing Swagger documentation...');
    
    // Test the Swagger docs endpoint
    const response = await fetch('http://localhost:3000/api/docs');
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Swagger documentation is working!');
      console.log(`📊 API Info: ${data.info.title} v${data.info.version}`);
      console.log(`🔗 Servers: ${data.servers.length} configured`);
      console.log(`📝 Paths: ${Object.keys(data.paths || {}).length} endpoints`);
      console.log(`🏷️  Tags: ${data.tags?.length || 0} categories`);
      console.log(`🔐 Security Schemes: ${Object.keys(data.components?.securitySchemes || {}).length} configured`);
    } else {
      console.log('❌ Swagger documentation endpoint failed');
      console.log(`Status: ${response.status}`);
    }
  } catch (error) {
    console.log('❌ Error testing Swagger documentation:');
    console.log(error.message);
  }
}

// Run the test
testSwaggerDocs(); 