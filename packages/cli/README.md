# @landofassets/cli

Command-line interface for the [Land of Assets](https://landofassets.com) platform.

## Installation

```bash
npm install -g @landofassets/cli
# or
pnpm add -g @landofassets/cli
# or
yarn global add @landofassets/cli
```

## Quick Start

```bash
# Authenticate with your account
loa auth login

# List your organizations
loa orgs list

# List projects in an organization
loa projects list --org my-org

# List assets in a project
loa assets list --org my-org --project my-project
```

> **Tip**: Use `loa <command> --help` or `loa <category> --help` to see available commands and their descriptions. For example, `loa auth --help` or `loa assets --help`.

## Commands

### Authentication

```bash
loa auth login          # Log in to your account (opens browser)
loa auth logout         # Log out and clear credentials
loa auth status         # Show current authentication status
```

### Configuration

```bash
loa config set --org <org> [--project <project>]   # Set default org and/or project
loa config get                                    # Get current configuration
loa config clear [--org] [--project]              # Clear configuration
```

### Organizations

```bash
loa orgs list                  # List all organizations
loa orgs get <slug>            # Get organization details
loa orgs create                # Create a new organization
loa orgs update <slug>         # Update an organization
loa orgs delete <slug>         # Delete an organization
```

### Projects

```bash
loa projects list --org <org>                    # List projects
loa projects get --org <org> --project <slug>    # Get project details
loa projects create --org <org>                  # Create a new project
loa projects update --org <org> --project <slug> # Update a project
loa projects delete --org <org> --project <slug> # Delete a project
```

### Assets

```bash
loa assets list --org <org> --project <project>                 # List assets
loa assets get --org <org> --project <project> --asset <slug>   # Get asset details
loa assets create --org <org> --project <project>               # Create a new asset
loa assets update --org <org> --project <project> --asset <slug> # Update an asset
loa assets delete --org <org> --project <project> --asset <slug> # Delete an asset
loa assets download --org <org> --project <project> --asset <slug> # Download asset files
loa assets thumbnail --org <org> --project <project> --asset <slug> # Get asset thumbnail
```

### Asset Versions

```bash
loa versions list --org <org> --project <project> --asset <asset>     # List versions
loa versions get --org <org> --project <project> --asset <asset> --version <id> # Get version
loa versions create --org <org> --project <project> --asset <asset>   # Create version
loa versions delete --org <org> --project <project> --asset <asset> --version <id> # Delete version
```

### Members

```bash
loa members list --org <org> [--project <project>]                # List members
loa members update <userName> --role <role> --org <org> [--project <project>]  # Update member role
loa members delete <userName> --org <org> [--project <project>]  # Remove member
```

### Member Invites

```bash
loa member-invites create <usernameOrEmail> --org <org> [--project <project>]  # Invite a user
loa member-invites list --org <org> [--project <project>]         # List invites
loa member-invites delete <memberInviteId>                       # Delete an invite
```

### Webhooks

```bash
loa webhooks create <url> --org <org> [--project <project>] --events <events>  # Create webhook
loa webhooks list --org <org> [--project <project>]         # List webhooks
loa webhooks delete <webhookId> --org <org> [--project <project>]  # Delete webhook
```

### API Tokens

```bash
loa api-tokens list          # List your API tokens
loa api-tokens create        # Create a new API token
loa api-tokens delete <id>   # Delete an API token
```

### Service Accounts

```bash
loa service-accounts list --org <org>          # List service accounts
loa service-accounts create --org <org>        # Create a service account
loa service-accounts delete --org <org> --id <id> # Delete a service account
```

### Comments

```bash
loa comments list --org <org> --project <project> --asset <asset>     # List comments
loa comments create --org <org> --project <project> --asset <asset>   # Create comment
loa comments edit --org <org> --project <project> --asset <asset> --id <id> # Edit comment
loa comments delete --org <org> --project <project> --asset <asset> --id <id> # Delete comment
```

### Notifications

```bash
loa notifications list             # List notifications
loa notifications mark-read <id>   # Mark notification as read
loa notifications mark-all-read    # Mark all notifications as read
```

### Health Check

```bash
loa health                 # Check API health status
```

## Configuration

The CLI stores configuration in `~/.config/loa/config.json`. Available settings:

- `host` - API base URL (default: `https://api.landofassets.com`, typically doesn't need to be set)
- `output` - Output format: `json`, `yaml`, or `csv` (default: `json`)

### Default Organization and Project

You can set a default organization and/or project to avoid specifying them with each command. This is useful if you're always working with a specific org or org/project combination.

```bash
# Set default organization
loa config set --org my-org

# Set both default organization and project
loa config set --org my-org --project my-project
```

Once set, you can omit the `--org` and `--project` flags from commands. For example:

```bash
# Without defaults
loa assets list --org my-org --project my-project

# With defaults set
loa assets list
```

To clear defaults, use `loa config clear --org` or `loa config clear --project`.

## Environment Variables

- `LOA_HOST` - Override the API host
- `LOA_TOKEN` - Provide an API token for authentication

## Requirements

- Node.js >= 23.0.0

## License

MIT

## Asset versions

```sh
# Publish the next major version (e.g. 2.0.0 after 1.0.0)
loa assets upload --org acme --project library --asset chair --file chair.glb
# Publish an explicit unused version
loa assets upload --org acme --project library --asset chair --file chair.glb --version 2.1.0
loa assets versions --org acme --project library --asset chair --format json
loa assets get --org acme --project library --asset chair@2.1
loa assets download --org acme --project library --asset chair@latest --format glb
```

Creation defaults to `1.0.0` and accepts an explicit `--version`. Reads support exact, minor, major, and `latest` references. `latest` means the highest numeric version; uploads may be out of order. Existing versions cannot be overwritten. Each version retains its own thumbnail, uploader, and creation time. `assets update` edits metadata; `assets upload` publishes file versions.
