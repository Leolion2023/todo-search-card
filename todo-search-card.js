customElements.whenDefined("card-tools").then(() => {
  var ct = customElements.get("card-tools");
  const TODO_DOMAIN = "todo";

  class TodoSearchCard extends ct.LitElement {
    static get properties() {
      return {
        config: { type: Object },
        hass: { type: Object },
        _results: { type: Array },
        _searchValue: { type: String },
        _lastHass: { type: Object },
        _todoItems: { type: Array },
      };
    }

    constructor() {
      super();
      this._results = [];
      this._searchValue = "";
      this._lastHass = null;
      this._todoItems = [];
      this._debouncedSearch = this._debounce((searchText) => {
        this._performSearch(searchText);
      }, 100);
    }

    shouldUpdate(changedProps) {
      return (
        changedProps.has("config") ||
        changedProps.has("_results") ||
        changedProps.has("_searchValue") ||
        changedProps.has("_todoItems")
      );
    }

    setConfig(config) {
      this.config = config;
      this.todo_list = config.todo_list;
      this.max_results = Number.isFinite(Number(this.config.max_results)) ? Number(this.config.max_results) : 10;
      this.search_text = this.config.search_text || "Type to search...";
      this.search_ticked = this.config.hasOwnProperty("search_ticked") ? this.config.search_ticked : true;
      this.grid_columns = Number.isFinite(Number(this.config.grid_columns)) ? Math.max(1, Number(this.config.grid_columns)) : 1;
      this.grid_gap = Number.isFinite(Number(this.config.grid_gap)) ? Math.max(0, Number(this.config.grid_gap)) : 12;
    }

    static getStubConfig() {
      return {
        todo_list: "",
        max_results: 10,
        search_text: "Type to search...",
        search_ticked: true,
        grid_columns: 1,
        grid_gap: 12,
      };
    }

    static getConfigElement() {
      return document.createElement("todo-search-card-editor");
    }

    getCardSize() {
      return 4;
    }

    render() {
      const sorted = (this._results || []).slice().sort((a, b) => {
        const sa = (a.summary || "").toLowerCase();
        const sb = (b.summary || "").toLowerCase();
        return sa < sb ? -1 : sa > sb ? 1 : 0;
      });
      const results = sorted.slice(0, this.max_results);
      const rows = results.map((item) => this._createResultRow(item));

      return ct.LitHtml`
      <ha-card>
        <div id="searchContainer">
          <div id="searchTextFieldContainer">
            <ha-input
              id="searchText"
              .value="${this._searchValue}"
              @input="${this._valueChanged}"
              no-label-float
              type="text"
              autocomplete="off"
              icon
              iconTrailing
              label="${this.search_text}"
            >
              ${
                this.search_text && this._serviceExists("todo.create_item") 
                  ? ct.LitHtml`<ha-icon-button
                      slot="end"
                      @click="${this._addEntry}"
                      title="Add entry"
                    >
                      <ha-icon icon="mdi:plus"></ha-icon>
                    </ha-icon-button>`
                  : ""
              }
              <ha-icon-button
                slot="end"
                @click="${this._clearInput}"
                title="Clear search"
              >
                <ha-icon icon="mdi:close"></ha-icon>
              </ha-icon-button>
            </ha-input>
          </div>

          ${
            results.length > 0
              ? ct.LitHtml`<div id="count">Showing ${results.length} of ${this._results.length} results</div>`
              : ""
          }
        </div>
        ${
          rows.length > 0
            ? ct.LitHtml`<div id="results" style="grid-template-columns: repeat(${this.grid_columns}, minmax(0, 1fr)); gap: ${this.grid_gap}px;">${rows}</div>`
            : ""
        }
      </ha-card>
    `;
    }

    _createResultRow(item) {
      const row = document.createElement("div");
      row.className = "search-row";
      row.style.padding = "12px";
      row.style.border = "1px solid var(--divider-color)";
      row.style.borderRadius = "12px";
      row.style.background = "var(--card-background-color)";
      row.style.cursor = "pointer";
      row.style.display = "flex";
      row.style.flexDirection = "column";
      row.style.gap = "4px";

      const header = document.createElement("div");
      header.style.display = "flex";
      header.style.justifyContent = "space-between";
      header.style.alignItems = "flex-start";
      header.style.gap = "8px";

      const summary = document.createElement("div");
      summary.textContent = item.summary || "(no summary)";
      summary.style.fontWeight = "600";
      header.appendChild(summary);

      const status = document.createElement("div");
      status.textContent = item.status === "completed" ? "Completed" : "Needs action";
      status.style.fontSize = "0.8em";
      status.style.opacity = "0.75";
      status.style.whiteSpace = "nowrap";
      header.appendChild(status);

      row.appendChild(header);

      const description = document.createElement("div");
      description.textContent = item.description || "";
      description.style.fontSize = "0.9em";
      description.style.opacity = item.description ? "0.9" : "0.5";
      description.style.lineHeight = "1.4";
      description.style.whiteSpace = "pre-wrap";
      row.appendChild(description);

      row.addEventListener("click", () => {
        this.hass.callService("todo", "update_item", {
          entity_id: this.todo_list,
          item: item.uid,
          status: this.search_ticked ? "needs_action" : "completed",
        });
      });
    
      return row;
    }

    _valueChanged(ev) {
      this._searchValue = ev.target.value;
      this._debouncedSearch(this._searchValue);
    }

    _clearInput() {
      this._searchValue = "";
      this._results = [];
    }

    _addEntry() {
      if (!this._serviceExists("todo.create_item")) {
        alert("The 'todo.create_item' service is not available in your Home Assistant instance.");
        return;
      }
      this.hass.callService("todo", "create_item", {
        entity_id: this.todo_list,
        summary: this._searchValue || "New item",
      });
    }

    _debounce(func, wait) {
      let timeout;
      return function executedFunction(...args) {
        // keep a reference to `func` so `this` isn't lost when callers use arrow/normal functions
        const later = async () => {
          clearTimeout(timeout);
          try {
            await func(...args);
          } catch (e) {
            // swallow or log so unhandled rejection doesn't bubble
            console.warn("Debounced function error", e);
          }
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
      };
    }
    async _loadTodoItems(todoListEntityId) {
        const data = await this.hass.callWS({
        type: "todo/item/list",
        entity_id: todoListEntityId
      });
    
      // return only completed or only not-completed items depending on `search_ticked`
      return data.items.filter(item => (
        (this.search_ticked && item.status === "completed") || (!this.search_ticked && item.status !== "completed")
      ));
    }

    _performSearch(searchText) {
      if (!this.config || !this.hass || searchText === "") {
        this._results = [];
        return;
      }

      try {
        this._loadTodoItems(this.todo_list).then(items => {
          this._todoItems = items;
          const newResults = this._todoItems.filter(i =>
            `${i.summary || ""} ${i.description || ""}`.toLowerCase().includes(searchText.toLowerCase())
          );
          this._results = newResults;
        });
      } catch (err) {
        console.warn(err);
        this._results = [];
      }
    }

    _serviceExists(serviceCall) {
      var [domain, service] = serviceCall.split(".");
      var servicesForDomain = this.hass.services[domain];
      return servicesForDomain && service in servicesForDomain;
    }

    static get styles() {
      return ct.LitCSS`
      #searchContainer {
        width: 95%;
        display: block;
        margin-left: auto;
        margin-right: auto;
      }
      #searchTextFieldContainer {
        display: flex;
        padding-top: 5px;
        padding-bottom: 5px;
      }
      #searchText {
        flex-grow: 1;
      }
      #count {
        text-align: right;
        font-style: italic;
      }
      #results {
        width: 95%;
        display: grid;
        padding-bottom: 15px;
        margin-top: 15px;
        margin-left: auto;
        margin-right: auto;
      }
    `;
    }
  }

  customElements.define("todo-search-card", TodoSearchCard);

  class TodoSearchCardEditor extends ct.LitElement {
    static get properties() {
      return {
        hass: { type: Object },
        config: { type: Object },
      };
    }

    setConfig(config) {
      this.config = { ...config };
    }

    _updateConfig(changes) {
      this.config = { ...this.config, ...changes };
      this.dispatchEvent(new CustomEvent("config-changed", {
        detail: { config: this.config },
        bubbles: true,
        composed: true,
      }));
    }

    _valueChanged(ev) {
      const target = ev.target;
      const value = target.type === "number" ? target.valueAsNumber : target.value;
      this._updateConfig({ [target.configValue]: value });
    }

    _toggleChanged(ev) {
      this._updateConfig({ [ev.target.configValue]: ev.target.checked });
    }

    _todoEntityFilter(entity) {
      return entity && entity.entity_id && entity.entity_id.split(".", 1)[0] === TODO_DOMAIN;
    }

    render() {
      const config = this.config || {};

      return ct.LitHtml`
        <div style="display: grid; gap: 16px; padding: 16px;">
          <div>
            <div style="font-weight: 600; margin-bottom: 8px;">Todo settings</div>
            <ha-entity-picker
              .hass=${this.hass}
              .value=${config.todo_list || ""}
              .includeDomains=${[TODO_DOMAIN]}
              .entityFilter=${this._todoEntityFilter}
              .configValue=${"todo_list"}
              @value-changed=${this._valueChanged}
              label="Todo list entity"
            ></ha-entity-picker>
            <ha-textfield
              .value=${config.search_text || "Type to search..."}
              .configValue=${"search_text"}
              @input=${this._valueChanged}
              label="Search text"
              style="display: block; margin-top: 12px;"
            ></ha-textfield>
            <ha-textfield
              type="number"
              min="1"
              step="1"
              .value=${String(config.max_results ?? 10)}
              .configValue=${"max_results"}
              @input=${this._valueChanged}
              label="Max results"
              style="display: block; margin-top: 12px;"
            ></ha-textfield>
            <div style="display: flex; align-items: center; justify-content: space-between; margin-top: 12px; gap: 12px;">
              <div>
                <div style="font-weight: 500;">Search ticked items</div>
                <div style="font-size: 0.85em; opacity: 0.75;">If off, the card searches unticked items.</div>
              </div>
              <ha-switch
                .checked=${config.search_ticked ?? true}
                .configValue=${"search_ticked"}
                @change=${this._toggleChanged}
              ></ha-switch>
            </div>
          </div>

          <div>
            <div style="font-weight: 600; margin-bottom: 8px;">Grid layout</div>
            <ha-textfield
              type="number"
              min="1"
              step="1"
              .value=${String(config.grid_columns ?? 1)}
              .configValue=${"grid_columns"}
              @input=${this._valueChanged}
              label="Columns"
              style="display: block;"
            ></ha-textfield>
            <ha-textfield
              type="number"
              min="0"
              step="1"
              .value=${String(config.grid_gap ?? 12)}
              .configValue=${"grid_gap"}
              @input=${this._valueChanged}
              label="Gap (px)"
              style="display: block; margin-top: 12px;"
            ></ha-textfield>
          </div>
        </div>
      `;
    }
  }

  customElements.define("todo-search-card-editor", TodoSearchCardEditor);
});

setTimeout(() => {
  if (customElements.get("card-tools")) return;
  customElements.define(
    "todo-search-card",
    class extends HTMLElement {
      setConfig() {
        throw new Error(
          "Can't find card-tools. See https://github.com/thomasloven/lovelace-card-tools"
        );
      }
    }
  );
}, 2000);

window.customCards = window.customCards || [];
window.customCards.push({
  type: "todo-search-card",
  name: "Todo Search Card",
  preview: true,
  description: "Card to search completed entries of a todolist",
});
