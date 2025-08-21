# Supabase Function Tester

A VS Code extension that allows you to test Supabase client-side functions, operations, and RPC calls directly within your code editor without needing a frontend application.

## 🚀 Features

- **Direct Function Testing**: Copy and paste Supabase client-side functions or operations and test them instantly
- **No Frontend Required**: Test your Supabase functions without building a frontend application
- **Simple Authentication**: Only requires your Supabase URL and anon key
- **Session-based Testing**: Support for testing authenticated requests including:
  - User authentication flows
  - User-protected operations
  - Session-aware RPC calls
- **In-Editor Experience**: Everything happens within VS Code - no context switching needed

## 📋 Prerequisites

- VS Code version 1.74.0 or higher
- A Supabase project with:
  - Project URL
  - Anon/public key

## 🛠 Installation

1. Install the extension from the VS Code marketplace
2. Restart VS Code
3. The extension will be ready to use!

## 🎯 Usage

### Getting Started

1. Open the Command Palette (`Ctrl+Shift+P` or `Cmd+Shift+P`)
2. Search for "Test Supabase Function"
3. Click on the command to open the testing panel

### Basic Function Testing

1. Configure your Supabase connection:
   - Enter your Supabase URL
   - Enter your anon key
2. Paste your Supabase client-side code
3. Click "Test" to execute the function
4. View results directly in the panel

### Session-based Testing

For testing authenticated operations:

1. Set up authentication in the panel
2. Log in with test credentials
3. Test user-protected functions with the active session
4. The extension maintains session state for subsequent requests

## 📝 Example Usage

```javascript
// Example: Testing a simple query
const { data, error } = await supabase
  .from('users')
  .select('*')
  .limit(10)

// Example: Testing an RPC call
const { data, error } = await supabase
  .rpc('get_user_profile', { user_id: '123' })

// Example: Testing with authentication
const { data, error } = await supabase
  .from('private_table')
  .select('*')
  .eq('user_id', user.id)
```

## 🔧 Configuration

The extension requires minimal configuration:

- **Supabase URL**: Your project's API URL
- **Anon Key**: Your project's anonymous/public key

These can be set through the extension panel when you first use it.

## 🔐 Security Notes

- Only use your anon/public key - never expose your service role key
- The extension operates with the same permissions as your frontend client
- All requests respect your Row Level Security (RLS) policies

## 🐛 Troubleshooting

### Common Issues

1. **Connection Failed**: Verify your Supabase URL and anon key are correct
2. **Authentication Errors**: Ensure your RLS policies allow the operation
3. **Function Not Found**: Check that your RPC function exists and is accessible

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License.

## 📞 Support

If you encounter any issues or have questions:
- Open an issue on GitHub
- Check the troubleshooting section above
