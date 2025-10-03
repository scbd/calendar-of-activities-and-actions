# MCP Configuration Examples

This directory contains example configurations for various MCP servers that can be used with VS Code.

## Files

- `mcp.json` - Active MCP server configuration for VS Code
- `mcp.example.json` - Example configuration with multiple servers (not in use)

## Usage

The `mcp.json` file is automatically loaded by VS Code's GitHub Copilot extension when the repository is opened.

## Adding Additional MCP Servers

To add more MCP servers to your configuration, edit `.vscode/mcp.json` and add additional entries under `mcpServers`:

```json
{
  "mcpServers": {
    "MCP_DOCKER": {
      "command": "docker",
      "args": ["mcp", "gateway", "run"]
    },
    "another-server": {
      "command": "path/to/server",
      "args": ["--option", "value"]
    }
  }
}
```

## Troubleshooting

If you encounter issues with MCP servers, see [MCP Docker Troubleshooting Guide](../docs/MCP_DOCKER_TROUBLESHOOTING.md).
