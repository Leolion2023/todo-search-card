# Todo Search Card

A Lovelace card that searches Todo list entries, with a graphical editor and configurable grid layout.

## Features

- 🔍 Quick Todo list entry search within the Home Assistant frontend
- Search either ticked or unticked entries
- 📋 Configurable result limits, placeholder text, and result grid

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
| grid_columns     | integer  | 1                   | Number of columns used for the results grid    |
| grid_gap         | integer  | 12                  | Gap between result tiles in pixels             |

### Example Configuration

```yaml
type: custom:todo-search-card
todo_list: todo.example
max_results: 10
search_text: "Search entities..."
search_ticked: true
grid_columns: 2
grid_gap: 12

```

## Graphical Setup

The card includes a graphical editor in Home Assistant's card editor. You can configure the todo list, search text, result limit, ticked state, and grid layout without editing YAML by hand.

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
- Show ticked and unticked in one go
- More layout presets for the result grid
