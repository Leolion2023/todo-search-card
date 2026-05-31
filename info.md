# Todo Search Card

A Lovelace card that enables searching entries out of todo lists.

## Features

- 🔍 Quick Todo list entry search within the Home Assistant frontend
- Search either ticked or not_ticked entries
- 📋 Configurable result limits and placeholder text

## Prerequisites

- Home Assistant
- [card-tools](https://github.com/thomasloven/lovelace-card-tools)

## Using the card

### Options

| Name             | Type     | Default             | Description                                    |
| ---------------- | -------- | ------------------- | ---------------------------------------------- |
| todo_list        | todo     |                     | The Todo list which should be searched         |
| max_results      | integer  | 10                  | Maximum number of search results to display    |
| search_text      | string   | "Type to search..." | Custom placeholder text                        |
| search_ticked    | boolean  | true                | Search only the ticked Todo list entries       |

### Example Configuration

```yaml
type: custom:search-card
todo_list: todo.example
max_results: 10
search_text: "Search entities..."
search_ticked: true

```

## Issues and Troubleshooting

If you encounter issues:

1. Clear browser cache
2. Restart Home Assistant
3. Verify card-tools is properly installed
4. Check your configuration syntax

If you believe you have found an error, please create an issue with:

- Your configuration
- Home Assistant version
- Browser and version
- Error messages (if any)

## Roadmap

Planned features:

- "Show all" results button
- More polished UI
- Show ticked and unticked in one go
