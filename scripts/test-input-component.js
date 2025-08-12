const fs = require('fs');
const path = require('path');

console.log('🧪 Testing Input component import...\n');

// Test the InputField.tsx file
const inputFieldPath = path.join(__dirname, '../src/components/form/input/InputField.tsx');

try {
  const inputFieldContent = fs.readFileSync(inputFieldPath, 'utf8');
  
  // Check if the component is properly exported
  if (inputFieldContent.includes('export default Input;')) {
    console.log('✅ Input component is properly exported as default export');
  } else {
    console.log('❌ Input component is not exported as default export');
  }
  
  // Check if the component is defined
  if (inputFieldContent.includes('const Input = React.forwardRef')) {
    console.log('✅ Input component is properly defined');
  } else {
    console.log('❌ Input component is not properly defined');
  }
  
  // Check if displayName is set
  if (inputFieldContent.includes('Input.displayName = \'Input\';')) {
    console.log('✅ Input component has displayName set');
  } else {
    console.log('❌ Input component does not have displayName set');
  }
  
} catch (error) {
  console.error('❌ Error reading InputField.tsx:', error.message);
}

// Test the RoleForm.tsx file
const roleFormPath = path.join(__dirname, '../src/components/superadmin/roles/RoleForm.tsx');

try {
  const roleFormContent = fs.readFileSync(roleFormPath, 'utf8');
  
  // Check if the import is correct
  if (roleFormContent.includes('import Input from \'@/components/form/input/InputField\';')) {
    console.log('✅ RoleForm.tsx has correct Input import');
  } else {
    console.log('❌ RoleForm.tsx has incorrect Input import');
  }
  
  // Check if Input is used in the component
  if (roleFormContent.includes('<Input')) {
    console.log('✅ Input component is used in RoleForm.tsx');
  } else {
    console.log('❌ Input component is not used in RoleForm.tsx');
  }
  
} catch (error) {
  console.error('❌ Error reading RoleForm.tsx:', error.message);
}

console.log('\n🎉 Input component import test completed!');
