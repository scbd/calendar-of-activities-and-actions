# MCP Docker Gateway Troubleshooting Guide

This guide helps you troubleshoot issues with the MCP_DOCKER server integration in VS Code.

## Overview

The MCP_DOCKER configuration enables VS Code to connect to Docker Desktop's MCP Gateway, which manages MCP servers like neo4j-memory. This provides access to tools and capabilities from containerized MCP servers.

## Prerequisites

1. **Docker Desktop** with MCP Gateway support installed
2. **VS Code** with GitHub Copilot extension
3. **Docker MCP Gateway** configured in Docker Desktop UI

## Configuration

The MCP_DOCKER server is configured in `.vscode/mcp.json`:

```json
{
  "mcpServers": {
    "MCP_DOCKER": {
      "command": "docker",
      "args": [
        "mcp",
        "gateway",
        "run"
      ]
    }
  }
}
```

**Note:** The `type` field is not needed as `stdio` is the default transport type.

## Common Issues and Solutions

### Issue 1: Server Not Starting

**Symptoms:**
```
Waiting for MCP server "MCP_DOCKER" to start...
Waiting for server to respond to `initialize` request...
```

**Solutions:**

1. **Verify Docker Desktop MCP Gateway is Running**
   - Open Docker Desktop
   - Navigate to the MCP section in settings
   - Ensure the MCP Gateway service is running
   - Check that neo4j-memory or other MCP servers are configured and active

2. **Check Neo4j Database Connection**
   - The neo4j-memory server requires a running Neo4j database
   - Verify Neo4j is running and accessible
   - Check environment variables in Docker Desktop MCP Gateway settings:
     - `NEO4J_URL` - Database connection URL
     - `NEO4J_USERNAME` - Database username
     - `NEO4J_PASSWORD` - Database password

3. **Restart Docker MCP Gateway**
   - In Docker Desktop, stop the MCP Gateway service
   - Wait a few seconds
   - Start the MCP Gateway service again
   - Reload VS Code window (Command Palette: "Developer: Reload Window")

4. **Check Docker Desktop Logs**
   - Open Docker Desktop
   - Go to the Troubleshoot section
   - View logs for MCP Gateway and neo4j-memory container
   - Look for connection errors or initialization failures

### Issue 2: Tools Not Appearing in VS Code

**Symptoms:**
- MCP_DOCKER server appears connected but no tools are available
- Gateway shows tools but VS Code doesn't

**Solutions:**

1. **Verify Gateway Configuration**
   ```bash
   # Check if gateway is running
   docker ps | grep mcp
   
   # View gateway logs
   docker logs <gateway-container-id>
   ```

2. **Reload VS Code Window**
   - Command Palette: "Developer: Reload Window"
   - This forces VS Code to reconnect to all MCP servers

3. **Check Server Initialization**
   - The neo4j-memory server may take time to initialize
   - Wait 30-60 seconds after starting
   - Check Docker Desktop for server status

### Issue 3: Connection Timeouts

**Symptoms:**
```
[info] Waiting for server to respond to `initialize` request...
[error] Server initialization timeout
```

**Solutions:**

1. **Increase System Resources**
   - The neo4j-memory container requires resources
   - Docker Desktop settings → Resources
   - Increase CPU and Memory allocation if needed

2. **Check Network Connectivity**
   - Ensure Docker can access required network resources
   - Check firewall settings
   - Verify no VPN or proxy interference

3. **Verify Environment Variables**
   - In Docker Desktop MCP Gateway UI
   - Ensure all required variables are set:
     - `NEO4J_URL`
     - `NEO4J_USERNAME`
     - `NEO4J_PASSWORD`
     - `NEO4J_DATABASE` (if using specific database)

## Debugging Steps

### Step 1: Verify Docker Desktop MCP Gateway

1. Open Docker Desktop
2. Go to Settings → MCP
3. Verify gateway is enabled and running
4. Check configured MCP servers list

### Step 2: Test Gateway Manually

```bash
# Run gateway command manually to see output
docker mcp gateway run

# This should start the gateway and show initialization logs
# Look for errors or warnings
```

### Step 3: Check Container Status

```bash
# List MCP-related containers
docker ps -a --filter "label=docker-mcp=true"

# Check logs for specific container
docker logs <container-name>
```

### Step 4: Verify Neo4j Connection

```bash
# Test Neo4j connectivity (if using local Neo4j)
# Replace with your credentials
docker run --rm \
  -e NEO4J_URL=bolt://localhost:7687 \
  -e NEO4J_USERNAME=neo4j \
  -e NEO4J_PASSWORD=your-password \
  neo4j/neo4j-admin cypher-shell -a bolt://localhost:7687 -u neo4j -p your-password "RETURN 1"
```

### Step 5: Review VS Code Logs

1. Open VS Code Output panel
2. Select "GitHub Copilot" from dropdown
3. Look for MCP_DOCKER connection attempts and errors
4. Note any error messages or stack traces

## Best Practices

1. **Keep Docker Desktop Updated**
   - MCP Gateway is a newer feature
   - Ensure you have the latest Docker Desktop version

2. **Monitor Resource Usage**
   - Neo4j and MCP servers can be resource-intensive
   - Monitor CPU and memory usage in Docker Desktop

3. **Use Dedicated Database**
   - For production use, use a dedicated Neo4j instance
   - Don't use the same database for multiple purposes

4. **Environment Variables**
   - Store sensitive credentials securely
   - Use environment variable files or Docker secrets
   - Don't commit credentials to version control

5. **Regular Restarts**
   - If experiencing issues, restart in this order:
     1. VS Code window reload
     2. Docker MCP Gateway restart
     3. Neo4j database restart
     4. Docker Desktop restart

## Additional Resources

- [Docker MCP Gateway Documentation](https://docs.docker.com/desktop/extensions-sdk/)
- [Neo4j Memory MCP Server](https://github.com/neo4j-labs/neo4j-mcp-server)
- [VS Code MCP Extension Documentation](https://code.visualstudio.com/docs)

## Getting Help

If you continue to experience issues:

1. **Collect Diagnostic Information**
   - VS Code version
   - Docker Desktop version
   - MCP Gateway version
   - Error messages from all sources

2. **Check GitHub Issues**
   - Search for similar issues in relevant repositories
   - neo4j-mcp-server issues
   - Docker Desktop issues

3. **Enable Verbose Logging**
   - In VS Code settings, enable MCP debug logging
   - In Docker Desktop, enable debug mode
   - Collect logs and share when seeking help

## Quick Checklist

When troubleshooting MCP_DOCKER initialization issues:

- [ ] Docker Desktop is running and up to date
- [ ] MCP Gateway is enabled in Docker Desktop settings
- [ ] Neo4j database is running and accessible
- [ ] Environment variables are correctly configured
- [ ] No firewall or network blocking
- [ ] Sufficient system resources (CPU, memory)
- [ ] VS Code window has been reloaded
- [ ] Docker MCP Gateway has been restarted
- [ ] Container logs show no errors
- [ ] VS Code output panel shows MCP connection attempts

## Example Working Configuration

### Docker Desktop MCP Gateway Settings

```yaml
servers:
  neo4j-memory:
    image: mcp/neo4j-memory
    environment:
      NEO4J_URL: bolt://host.docker.internal:7687
      NEO4J_USERNAME: neo4j
      NEO4J_PASSWORD: your-secure-password
      NEO4J_DATABASE: neo4j
    resources:
      cpus: "1"
      memory: "2Gb"
```

### VS Code MCP Configuration (`.vscode/mcp.json`)

```json
{
  "mcpServers": {
    "MCP_DOCKER": {
      "command": "docker",
      "args": [
        "mcp",
        "gateway",
        "run"
      ]
    }
  }
}
```

This configuration allows VS Code to connect to the Docker MCP Gateway, which then provides access to the neo4j-memory tools.
