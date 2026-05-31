customElements.whenDefined("card-tools").then(() => {
  var ct = customElements.get("card-tools");

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
      this.max_results = this.config.max_results || 10;
      this.search_text = this.config.search_text || "Type to search...";
      this.search_ticked = this.config.hasOwnProperty("search_ticked") ? this.config.search_ticked : true;
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
            <ha-textfield
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
              <ha-icon icon="mdi:magnify" id="searchIcon" slot="leadingIcon"></ha-icon>
              <ha-icon-button
                slot="trailingIcon"
                @click="${this._clearInput}"
                alt="Clear"
                title="Clear"
              >
                <ha-icon icon="mdi:close"></ha-icon>
              </ha-icon-button>
            </ha-textfield>
          </div>

          ${
            results.length > 0
              ? ct.LitHtml`<div id="count">Showing ${results.length} of ${this._results.length} results</div>`
              : ""
          }
        </div>
        ${
          rows.length > 0
            ? ct.LitHtml`<div id="results">${rows}</div>`
            : ""
        }
      </ha-card>
    `;
    }

    _createResultRow(item) {
      const row = document.createElement("div");
      row.className = "search-row";
      row.style.padding = "8px";
      row.style.borderBottom = "1px solid var(--divider-color)";
      row.style.cursor = "pointer";
      row.textContent = item.summary || "(no summary)";
    
      row.addEventListener("click", () => {
        // toggle completed -> needs_action (example) or vice versa
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
            i.summary.toLowerCase().includes(searchText.toLowerCase())
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
        width: 90%;
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
        width: 90%;
        display: block;
        padding-bottom: 15px;
        margin-top: 15px;
        margin-left: auto;
        margin-right: auto;
      }
    `;
    }
  }

  customElements.define("todo-search-card", TodoSearchCard);
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
