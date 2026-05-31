# Todo Search Card

A Lovelace card for Home Assistant that searches Todo list entries and lets you toggle their completed state.

## Features

- 🔍 Quick Todo list entry search within the Home Assistant frontend
- ✅ Option to search ticked (completed) or unticked entries
- 📋 Configurable result limits and placeholder text

## Prerequisites

- Home Assistant
- [card-tools](https://github.com/thomasloven/lovelace-card-tools)

## Installation

### HACS (Recommended)

Search for "Todo Search Card" in HACS and install.

### Manual Install

1. Download `todo-search-card.js`
2. Copy it to `config/www/todo-search-card/` (create directory if needed)
3. Add to your Lovelace resources (example for `ui-lovelace.yaml`):

```yaml
resources:
  - url: /local/todo-search-card/todo-search-card.js?v=0
    type: module
```

## Configuration

### Options

| Name          | Type     | Default             | Description                                  |
| ------------- | -------- | ------------------- | -------------------------------------------- |
| `todo_list` | string |                     | The todo list entity id to search (required) |
| `max_results` | integer | 10               | Maximum number of search results to display  |
| `search_text` | string | "Type to search..." | Placeholder text for the search field |
| `search_ticked` | boolean | true          | When `true` search completed (ticked) items; when `false` search unticked items |
| `grid_columns` | integer | 1              | Number of columns used to render results     |
| `grid_gap` | integer | 12                   | Gap between result tiles in pixels           |

> Note: The card expects a todo integration that exposes a websocket endpoint `todo/item/list` (returns `{ items: [...] }`) and a service `todo.update_item` used to toggle item status.

### Example

```yaml
type: custom:todo-search-card
todo_list: todo.example
max_results: 10
search_text: "Search entries..."
search_ticked: true
grid_columns: 2
grid_gap: 12
```

## Graphical Setup

The card includes a graphical editor in Home Assistant's card editor. You can configure the todo list, search text, result limit, ticked state, and grid layout without editing YAML by hand.
The entity picker in that editor is limited to `todo` entities only.

## Behavior

- Typing in the search field queries the configured todo list and shows matching entries.
- Clicking a result will call the `todo.update_item` service to toggle the entry's status.
- Results are displayed as a configurable grid, not a single vertical list.

## Known issues (and fixes applied)

- The original code used `this.config.search_ticked || true`, which forced the value to `true` even when the user set `false`. This has been fixed so `search_ticked` respects `false` values.
- Results are now sorted by their `summary` before limiting to `max_results` to ensure stable ordering.
- The card now exposes a graphical setup editor and configurable result grid columns/gap.

## Troubleshooting

If you encounter issues:

1. Clear browser cache
2. Restart Home Assistant
3. Verify `card-tools` is installed
4. Ensure your todo integration provides the expected WS call and service

For bug reports, please open an issue and include your configuration, Home Assistant version, browser, and any error messages.
