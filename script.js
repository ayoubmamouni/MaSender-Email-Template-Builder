// Email Template Builder Script
class EmailBuilder {
  constructor() {
    this.canvas = document.getElementById("emailCanvas");
    this.settingsModal = document.getElementById("settingsModal");
    this.modalContent = document.getElementById("modalContent");
    this.exportBtn = document.getElementById("exportBtn");
    this.resetBtn = document.getElementById("resetBtn");
    this.canvasSettingsBtn = document.getElementById("canvasSettingsBtn");
    this.saveBtn = document.getElementById("saveBtn");
    this.cancelBtn = document.getElementById("cancelBtn");
    this.currentElement = null;
    this.elementCounter = 0;
    this.draggedElement = null;
    this.canvasBackgroundColor = "#ffffff";

    this.init();
  }

  init() {
    this.setupDragAndDrop();
    this.setupEventListeners();
    this.loadFromLocalStorage();
  }

  setupEventListeners() {
    // Export button - Copy template to clipboard
    this.exportBtn.addEventListener("click", () =>
      this.copyTemplateToClipboard(),
    );

    // Reset button - Clear canvas
    this.resetBtn.addEventListener("click", () => this.resetCanvas());

    // Canvas settings button
    this.canvasSettingsBtn.addEventListener("click", () =>
      this.openCanvasSettings(),
    );

    // Modal buttons
    this.saveBtn.addEventListener("click", () => this.saveElementSettings());
    this.cancelBtn.addEventListener("click", () => this.closeModal());

    // Close modal when clicking outside
    this.settingsModal.addEventListener("click", (e) => {
      if (e.target === this.settingsModal) {
        this.closeModal();
      }
    });

    // Auto-save to localStorage on changes
    this.canvas.addEventListener("DOMSubtreeModified", () => {
      this.saveToLocalStorage();
    });

    // Use MutationObserver for better browser support
    if (window.MutationObserver) {
      const observer = new MutationObserver(() => {
        this.saveToLocalStorage();
      });
      observer.observe(this.canvas, {
        childList: true,
        subtree: true,
        attributes: true,
        characterData: true,
      });
    }
  }

  setupDragAndDrop() {
    const elementItems = document.querySelectorAll(".element-item");

    // Make elements draggable
    elementItems.forEach((item) => {
      item.addEventListener("dragstart", (e) => {
        e.dataTransfer.setData("text/plain", e.target.dataset.type);
      });
    });

    // Canvas drop zone
    this.canvas.addEventListener("dragover", (e) => {
      e.preventDefault();
      this.canvas.classList.add("active");
    });

    this.canvas.addEventListener("dragleave", (e) => {
      if (!this.canvas.contains(e.relatedTarget)) {
        this.canvas.classList.remove("active");
      }
    });

    this.canvas.addEventListener("drop", (e) => {
      e.preventDefault();
      this.canvas.classList.remove("active");

      const elementType = e.dataTransfer.getData("text/plain");
      if (elementType) {
        this.addElement(elementType);
      }
    });
  }

  setupElementReordering(elementId) {
    const element = document.getElementById(elementId);

    element.addEventListener("dragstart", (e) => {
      this.draggedElement = element;
      element.style.opacity = "0.5";
      e.dataTransfer.effectAllowed = "move";
    });

    element.addEventListener("dragend", (e) => {
      element.style.opacity = "";
      this.draggedElement = null;
    });

    element.addEventListener("dragover", (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";

      const afterElement = this.getDragAfterElement(this.canvas, e.clientY);
      if (afterElement == null) {
        this.canvas.appendChild(this.draggedElement);
      } else {
        this.canvas.insertBefore(this.draggedElement, afterElement);
      }
    });
  }

  getDragAfterElement(container, y) {
    const draggableElements = [
      ...container.querySelectorAll(".element:not(.dragging)"),
    ];

    return draggableElements.reduce(
      (closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;

        if (offset < 0 && offset > closest.offset) {
          return { offset: offset, element: child };
        } else {
          return closest;
        }
      },
      { offset: Number.NEGATIVE_INFINITY },
    ).element;
  }

  clearCanvas() {
    this.canvas.innerHTML = `
            <div class="text-center text-gray-500 py-16" id="emptyState">
                <i class="fas fa-mouse-pointer text-4xl mb-4"></i>
                <p>Drag elements here to build your email</p>
            </div>
        `;
  }

  resetCanvas() {
    if (
      confirm(
        "Are you sure you want to reset the canvas? This will delete all elements.",
      )
    ) {
      this.clearCanvas();
      this.canvasBackgroundColor = "#ffffff";
      this.canvas.style.backgroundColor = this.canvasBackgroundColor;
      this.elementCounter = 0;
      this.saveToLocalStorage();
    }
  }

  addElement(type) {
    // Remove empty state if it exists
    const emptyState = document.getElementById("emptyState");
    if (emptyState) {
      emptyState.remove();
    }

    this.elementCounter++;
    const elementId = `element_${type}_${this.elementCounter}`;

    let elementHTML = "";

    switch (type) {
      case "heading":
        elementHTML = this.createHeadingElement(elementId);
        break;
      case "text":
        elementHTML = this.createTextElement(elementId);
        break;
      case "image":
        elementHTML = this.createImageElement(elementId);
        break;
      case "button":
        elementHTML = this.createButtonElement(elementId);
        break;
      case "table":
        elementHTML = this.createTableElement(elementId);
        break;
      case "divider":
        elementHTML = this.createDividerElement(elementId);
        break;
      case "spacer":
        elementHTML = this.createSpacerElement(elementId);
        break;
      case "list":
        elementHTML = this.createListElement(elementId);
        break;
    }

    this.canvas.insertAdjacentHTML("beforeend", elementHTML);
    this.setupElementEvents(elementId);
    this.setupElementReordering(elementId);
    this.saveToLocalStorage();
  }

  createHeadingElement(id) {
    return `
            <div class="element" id="${id}" data-type="heading" draggable="true">
                <div class="element-settings">
                    <button class="move-btn bg-gray-500 text-white px-2 py-1 rounded text-xs mr-1" title="Drag to reorder">
                        <i class="fas fa-arrows-alt"></i>
                    </button>
                    <button class="edit-btn bg-blue-500 text-white px-2 py-1 rounded text-xs mr-1">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="delete-btn bg-red-500 text-white px-2 py-1 rounded text-xs">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
                <h2 class="text-2xl font-bold text-gray-800" data-content>Your Heading Here</h2>
            </div>
        `;
  }

  createTextElement(id) {
    return `
            <div class="element" id="${id}" data-type="text" draggable="true">
                <div class="element-settings">
                    <button class="move-btn bg-gray-500 text-white px-2 py-1 rounded text-xs mr-1" title="Drag to reorder">
                        <i class="fas fa-arrows-alt"></i>
                    </button>
                    <button class="edit-btn bg-blue-500 text-white px-2 py-1 rounded text-xs mr-1">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="delete-btn bg-red-500 text-white px-2 py-1 rounded text-xs">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
                <p class="text-gray-700 leading-relaxed" data-content>Your text content goes here. You can edit this to add your own message.</p>
            </div>
        `;
  }

  createImageElement(id) {
    return `
            <div class="element" id="${id}" data-type="image" draggable="true">
                <div class="element-settings">
                    <button class="move-btn bg-gray-500 text-white px-2 py-1 rounded text-xs mr-1" title="Drag to reorder">
                        <i class="fas fa-arrows-alt"></i>
                    </button>
                    <button class="edit-btn bg-blue-500 text-white px-2 py-1 rounded text-xs mr-1">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="delete-btn bg-red-500 text-white px-2 py-1 rounded text-xs">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
                <img src="https://via.placeholder.com/400x200/4f46e5/ffffff?text=Your+Image"
                     alt="Placeholder"
                     class="w-full max-w-md mx-auto rounded"
                     data-content>
            </div>
        `;
  }

  createButtonElement(id) {
    return `
            <div class="element" id="${id}" data-type="button" draggable="true">
                <div class="element-settings">
                    <button class="move-btn bg-gray-500 text-white px-2 py-1 rounded text-xs mr-1" title="Drag to reorder">
                        <i class="fas fa-arrows-alt"></i>
                    </button>
                    <button class="edit-btn bg-blue-500 text-white px-2 py-1 rounded text-xs mr-1">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="delete-btn bg-red-500 text-white px-2 py-1 rounded text-xs">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
                <div class="text-center">
                    <a href="#" class="inline-block bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors" data-content data-href="#">
                        Click Here
                    </a>
                </div>
            </div>
        `;
  }

  createTableElement(id) {
    return `
            <div class="element" id="${id}" data-type="table" draggable="true">
                <div class="element-settings">
                    <button class="move-btn bg-gray-500 text-white px-2 py-1 rounded text-xs mr-1" title="Drag to reorder">
                        <i class="fas fa-arrows-alt"></i>
                    </button>
                    <button class="edit-btn bg-blue-500 text-white px-2 py-1 rounded text-xs mr-1">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="delete-btn bg-red-500 text-white px-2 py-1 rounded text-xs">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
                <table class="w-full border-collapse border border-gray-300" data-content>
                    <thead>
                        <tr class="bg-gray-100">
                            <th class="border border-gray-300 px-4 py-2 text-left">Header 1</th>
                            <th class="border border-gray-300 px-4 py-2 text-left">Header 2</th>
                            <th class="border border-gray-300 px-4 py-2 text-left">Header 3</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td class="border border-gray-300 px-4 py-2">Row 1, Col 1</td>
                            <td class="border border-gray-300 px-4 py-2">Row 1, Col 2</td>
                            <td class="border border-gray-300 px-4 py-2">Row 1, Col 3</td>
                        </tr>
                        <tr>
                            <td class="border border-gray-300 px-4 py-2">Row 2, Col 1</td>
                            <td class="border border-gray-300 px-4 py-2">Row 2, Col 2</td>
                            <td class="border border-gray-300 px-4 py-2">Row 2, Col 3</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        `;
  }

  createDividerElement(id) {
    return `
            <div class="element" id="${id}" data-type="divider" draggable="true">
                <div class="element-settings">
                    <button class="move-btn bg-gray-500 text-white px-2 py-1 rounded text-xs mr-1" title="Drag to reorder">
                        <i class="fas fa-arrows-alt"></i>
                    </button>
                    <button class="edit-btn bg-blue-500 text-white px-2 py-1 rounded text-xs mr-1">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="delete-btn bg-red-500 text-white px-2 py-1 rounded text-xs">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
                <hr class="border-t-2 border-gray-300 my-4" data-content>
            </div>
        `;
  }

  createSpacerElement(id) {
    return `
            <div class="element" id="${id}" data-type="spacer" draggable="true">
                <div class="element-settings">
                    <button class="move-btn bg-gray-500 text-white px-2 py-1 rounded text-xs mr-1" title="Drag to reorder">
                        <i class="fas fa-arrows-alt"></i>
                    </button>
                    <button class="edit-btn bg-blue-500 text-white px-2 py-1 rounded text-xs mr-1">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="delete-btn bg-red-500 text-white px-2 py-1 rounded text-xs">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
                <div class="py-4" data-content style="background-color: transparent;">
                    <div class="text-center text-gray-400 text-sm">Spacer (40px)</div>
                </div>
            </div>
        `;
  }

  createListElement(id) {
    return `
            <div class="element" id="${id}" data-type="list" draggable="true">
                <div class="element-settings">
                    <button class="move-btn bg-gray-500 text-white px-2 py-1 rounded text-xs mr-1" title="Drag to reorder">
                        <i class="fas fa-arrows-alt"></i>
                    </button>
                    <button class="edit-btn bg-blue-500 text-white px-2 py-1 rounded text-xs mr-1">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="delete-btn bg-red-500 text-white px-2 py-1 rounded text-xs">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
                <ul class="list-disc list-inside text-gray-700" data-content>
                    <li>First list item</li>
                    <li>Second list item</li>
                    <li>Third list item</li>
                </ul>
            </div>
        `;
  }

  setupElementEvents(elementId) {
    const element = document.getElementById(elementId);
    const editBtn = element.querySelector(".edit-btn");
    const deleteBtn = element.querySelector(".delete-btn");

    editBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      this.editElement(elementId);
    });
    deleteBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      this.deleteElement(elementId);
    });
  }

  editElement(elementId) {
    this.currentElement = document.getElementById(elementId);
    const type = this.currentElement.dataset.type;

    let modalHTML = "";

    switch (type) {
      case "heading":
        modalHTML = this.createHeadingModal();
        break;
      case "text":
        modalHTML = this.createTextModal();
        break;
      case "image":
        modalHTML = this.createImageModal();
        break;
      case "button":
        modalHTML = this.createButtonModal();
        break;
      case "table":
        modalHTML = this.createTableModal();
        break;
      case "divider":
        modalHTML = this.createDividerModal();
        break;
      case "spacer":
        modalHTML = this.createSpacerModal();
        break;
      case "list":
        modalHTML = this.createListModal();
        break;
    }

    this.modalContent.innerHTML = modalHTML;
    this.settingsModal.classList.remove("hidden");
    this.populateModalFields();
    this.setupColorPickers();
  }

  openCanvasSettings() {
    this.currentElement = null;
    const modalHTML = this.createCanvasSettingsModal();
    this.modalContent.innerHTML = modalHTML;
    this.settingsModal.classList.remove("hidden");
    this.populateCanvasSettings();
    this.setupColorPickers();
  }

  createCanvasSettingsModal() {
    return `
            <div class="space-y-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Canvas Background Color</label>
                    <div class="flex space-x-2">
                        <select id="canvasBackgroundColor" class="flex-1 border border-gray-300 rounded px-3 py-2">
                            <option value="#ffffff">White</option>
                            <option value="#f8fafc">Light Gray</option>
                            <option value="#f1f5f9">Slate</option>
                            <option value="#fef2f2">Light Red</option>
                            <option value="#f0f9ff">Light Blue</option>
                            <option value="#f0fdf4">Light Green</option>
                            <option value="#fefce8">Light Yellow</option>
                            <option value="#faf5ff">Light Purple</option>
                            <option value="custom">Custom Color</option>
                        </select>
                        <input type="color" id="canvasCustomColor" class="w-12 h-10 border border-gray-300 rounded" value="#ffffff" style="display: none;">
                    </div>
                </div>
            </div>
        `;
  }

  createHeadingModal() {
    return `
            <div class="space-y-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Heading Text</label>
                    <input type="text" id="headingText" class="w-full border border-gray-300 rounded px-3 py-2" placeholder="Enter heading text">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Font Size</label>
                    <select id="headingSize" class="w-full border border-gray-300 rounded px-3 py-2">
                        <option value="text-xl">Small (XL)</option>
                        <option value="text-2xl">Medium (2XL)</option>
                        <option value="text-3xl">Large (3XL)</option>
                        <option value="text-4xl">Extra Large (4XL)</option>
                    </select>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Text Color</label>
                    <div class="flex space-x-2">
                        <select id="headingColor" class="flex-1 border border-gray-300 rounded px-3 py-2">
                            <option value="text-gray-800">Dark Gray</option>
                            <option value="text-black">Black</option>
                            <option value="text-indigo-600">Indigo</option>
                            <option value="text-blue-600">Blue</option>
                            <option value="text-green-600">Green</option>
                            <option value="text-red-600">Red</option>
                            <option value="custom">Custom Color</option>
                        </select>
                        <input type="color" id="headingCustomColor" class="w-12 h-10 border border-gray-300 rounded" value="#1f2937">
                    </div>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Text Alignment</label>
                    <select id="headingAlign" class="w-full border border-gray-300 rounded px-3 py-2">
                        <option value="text-left">Left</option>
                        <option value="text-center">Center</option>
                        <option value="text-right">Right</option>
                    </select>
                </div>
            </div>
        `;
  }

  createTableModal() {
    return `
            <div class="space-y-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Table Content (HTML)</label>
                    <textarea id="tableContent" rows="8" class="w-full border border-gray-300 rounded px-3 py-2 font-mono text-sm" placeholder="Edit table HTML content"></textarea>
                    <p class="text-xs text-gray-500 mt-1">Edit the table structure directly. Be careful with HTML syntax.</p>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Border Style</label>
                    <select id="tableBorder" class="w-full border border-gray-300 rounded px-3 py-2">
                        <option value="border border-gray-300">Gray Border</option>
                        <option value="border border-black">Black Border</option>
                        <option value="border-0">No Border</option>
                        <option value="border border-blue-300">Blue Border</option>
                        <option value="border border-green-300">Green Border</option>
                    </select>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Table Width</label>
                    <select id="tableWidth" class="w-full border border-gray-300 rounded px-3 py-2">
                        <option value="w-full">Full Width</option>
                        <option value="w-3/4">75%</option>
                        <option value="w-1/2">50%</option>
                        <option value="w-1/3">33%</option>
                    </select>
                </div>
            </div>
        `;
  }

  createDividerModal() {
    return `
            <div class="space-y-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Divider Style</label>
                    <select id="dividerStyle" class="w-full border border-gray-300 rounded px-3 py-2">
                        <option value="border-t-2 border-gray-300">Solid Gray</option>
                        <option value="border-t-2 border-black">Solid Black</option>
                        <option value="border-t border-dashed border-gray-400">Dashed Gray</option>
                        <option value="border-t-4 border-indigo-500">Thick Indigo</option>
                        <option value="border-t-2 border-red-400">Red</option>
                        <option value="border-t-2 border-green-400">Green</option>
                        <option value="border-t-2 border-blue-400">Blue</option>
                    </select>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Spacing</label>
                    <select id="dividerSpacing" class="w-full border border-gray-300 rounded px-3 py-2">
                        <option value="my-2">Small (8px)</option>
                        <option value="my-4">Medium (16px)</option>
                        <option value="my-6">Large (24px)</option>
                        <option value="my-8">Extra Large (32px)</option>
                    </select>
                </div>
            </div>
        `;
  }

  createSpacerModal() {
    return `
            <div class="space-y-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Spacer Height</label>
                    <select id="spacerHeight" class="w-full border border-gray-300 rounded px-3 py-2">
                        <option value="py-2">Small (16px)</option>
                        <option value="py-4">Medium (32px)</option>
                        <option value="py-6">Large (48px)</option>
                        <option value="py-8">Extra Large (64px)</option>
                        <option value="py-12">Huge (96px)</option>
                    </select>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Show Visual Guide</label>
                    <select id="spacerVisual" class="w-full border border-gray-300 rounded px-3 py-2">
                        <option value="true">Show in Builder</option>
                        <option value="false">Hide in Builder</option>
                    </select>
                    <p class="text-xs text-gray-500 mt-1">Visual guide only shows in the builder, not in final email.</p>
                </div>
            </div>
        `;
  }

  createListModal() {
    return `
            <div class="space-y-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">List Items (one per line)</label>
                    <textarea id="listItems" rows="6" class="w-full border border-gray-300 rounded px-3 py-2" placeholder="Enter list items, one per line"></textarea>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">List Type</label>
                    <select id="listType" class="w-full border border-gray-300 rounded px-3 py-2">
                        <option value="ul">Bullet Points (•)</option>
                        <option value="ol">Numbered List (1, 2, 3)</option>
                    </select>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">List Style</label>
                    <select id="listStyle" class="w-full border border-gray-300 rounded px-3 py-2">
                        <option value="list-disc list-inside">Disc Bullets</option>
                        <option value="list-decimal list-inside">Numbers</option>
                        <option value="list-square list-inside">Square Bullets</option>
                        <option value="list-none">No Bullets/Numbers</option>
                    </select>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Text Color</label>
                    <div class="flex space-x-2">
                        <select id="listColor" class="flex-1 border border-gray-300 rounded px-3 py-2">
                            <option value="text-gray-700">Gray</option>
                            <option value="text-black">Black</option>
                            <option value="text-indigo-600">Indigo</option>
                            <option value="text-blue-600">Blue</option>
                            <option value="text-green-600">Green</option>
                            <option value="text-red-600">Red</option>
                            <option value="custom">Custom Color</option>
                        </select>
                        <input type="color" id="listCustomColor" class="w-12 h-10 border border-gray-300 rounded" value="#374151">
                    </div>
                </div>
            </div>
        `;
  }

  createTextModal() {
    return `
            <div class="space-y-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Text Content</label>
                    <textarea id="textContent" rows="4" class="w-full border border-gray-300 rounded px-3 py-2" placeholder="Enter your text content"></textarea>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Font Size</label>
                    <select id="textSize" class="w-full border border-gray-300 rounded px-3 py-2">
                        <option value="text-sm">Small</option>
                        <option value="text-base">Medium</option>
                        <option value="text-lg">Large</option>
                        <option value="text-xl">Extra Large</option>
                    </select>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Text Color</label>
                    <div class="flex space-x-2">
                        <select id="textColor" class="flex-1 border border-gray-300 rounded px-3 py-2">
                            <option value="text-gray-700">Gray</option>
                            <option value="text-black">Black</option>
                            <option value="text-indigo-600">Indigo</option>
                            <option value="text-blue-600">Blue</option>
                            <option value="text-green-600">Green</option>
                            <option value="text-red-600">Red</option>
                            <option value="custom">Custom Color</option>
                        </select>
                        <input type="color" id="textCustomColor" class="w-12 h-10 border border-gray-300 rounded" value="#374151">
                    </div>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Text Alignment</label>
                    <select id="textAlign" class="w-full border border-gray-300 rounded px-3 py-2">
                        <option value="text-left">Left</option>
                        <option value="text-center">Center</option>
                        <option value="text-right">Right</option>
                    </select>
                </div>
            </div>
        `;
  }

  createImageModal() {
    return `
            <div class="space-y-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Image URL</label>
                    <input type="url" id="imageUrl" class="w-full border border-gray-300 rounded px-3 py-2" placeholder="https://example.com/image.jpg">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Alt Text</label>
                    <input type="text" id="imageAlt" class="w-full border border-gray-300 rounded px-3 py-2" placeholder="Image description">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Image Width</label>
                    <select id="imageWidth" class="w-full border border-gray-300 rounded px-3 py-2">
                        <option value="w-full max-w-xs">Small (XS)</option>
                        <option value="w-full max-w-sm">Small (SM)</option>
                        <option value="w-full max-w-md">Medium (MD)</option>
                        <option value="w-full max-w-lg">Large (LG)</option>
                        <option value="w-full max-w-xl">Extra Large (XL)</option>
                        <option value="w-full">Full Width</option>
                    </select>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Alignment</label>
                    <select id="imageAlign" class="w-full border border-gray-300 rounded px-3 py-2">
                        <option value="mx-auto">Center</option>
                        <option value="mr-auto">Left</option>
                        <option value="ml-auto">Right</option>
                    </select>
                </div>
            </div>
        `;
  }

  createButtonModal() {
    return `
            <div class="space-y-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Button Text</label>
                    <input type="text" id="buttonText" class="w-full border border-gray-300 rounded px-3 py-2" placeholder="Button text">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Button URL</label>
                    <input type="url" id="buttonUrl" class="w-full border border-gray-300 rounded px-3 py-2" placeholder="https://example.com">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Button Color</label>
                    <div class="flex space-x-2">
                        <select id="buttonColor" class="flex-1 border border-gray-300 rounded px-3 py-2">
                            <option value="bg-indigo-600 hover:bg-indigo-700">Indigo</option>
                            <option value="bg-blue-600 hover:bg-blue-700">Blue</option>
                            <option value="bg-green-600 hover:bg-green-700">Green</option>
                            <option value="bg-red-600 hover:bg-red-700">Red</option>
                            <option value="bg-purple-600 hover:bg-purple-700">Purple</option>
                            <option value="bg-gray-600 hover:bg-gray-700">Gray</option>
                            <option value="custom">Custom Color</option>
                        </select>
                        <input type="color" id="buttonCustomColor" class="w-12 h-10 border border-gray-300 rounded" value="#4f46e5">
                    </div>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Button Size</label>
                    <select id="buttonSize" class="w-full border border-gray-300 rounded px-3 py-2">
                        <option value="px-4 py-2 text-sm">Small</option>
                        <option value="px-6 py-3 text-base">Medium</option>
                        <option value="px-8 py-4 text-lg">Large</option>
                    </select>
                </div>
            </div>
        `;
  }

  setupColorPickers() {
    // Handle custom color selection for all color inputs
    const colorSelects = document.querySelectorAll("select[id$='Color']");
    colorSelects.forEach((select) => {
      const colorInput = document.getElementById(
        select.id.replace("Color", "CustomColor"),
      );
      if (colorInput) {
        select.addEventListener("change", () => {
          colorInput.style.display =
            select.value === "custom" ? "block" : "none";
        });

        // Initial state
        colorInput.style.display = select.value === "custom" ? "block" : "none";
      }
    });

    // Handle canvas background color
    const canvasColorSelect = document.getElementById("canvasBackgroundColor");
    const canvasCustomColor = document.getElementById("canvasCustomColor");
    if (canvasColorSelect && canvasCustomColor) {
      canvasColorSelect.addEventListener("change", () => {
        canvasCustomColor.style.display =
          canvasColorSelect.value === "custom" ? "block" : "none";
      });

      // Initial state for canvas color picker
      canvasCustomColor.style.display =
        canvasColorSelect.value === "custom" ? "block" : "none";

      // Update custom color picker value when select changes
      canvasColorSelect.addEventListener("change", () => {
        if (canvasColorSelect.value !== "custom") {
          canvasCustomColor.value = canvasColorSelect.value;
        }
        // Real-time preview of color changes
        this.previewCanvasColor();
      });

      // Real-time preview for custom color changes
      canvasCustomColor.addEventListener("input", () => {
        this.previewCanvasColor();
      });
    }
  }

  populateCanvasSettings() {
    const canvasColorSelect = document.getElementById("canvasBackgroundColor");
    const canvasCustomColor = document.getElementById("canvasCustomColor");

    if (canvasColorSelect && canvasCustomColor) {
      // Check if current color is in predefined options
      const isCustomColor = !Array.from(canvasColorSelect.options).some(
        (option) => option.value === this.canvasBackgroundColor,
      );

      if (isCustomColor) {
        canvasColorSelect.value = "custom";
        canvasCustomColor.style.display = "block";
        canvasCustomColor.value = this.canvasBackgroundColor;
      } else {
        canvasColorSelect.value = this.canvasBackgroundColor;
        canvasCustomColor.style.display = "none";
      }
    }
  }

  previewCanvasColor() {
    const canvasColorSelect = document.getElementById("canvasBackgroundColor");
    const canvasCustomColor = document.getElementById("canvasCustomColor");

    if (canvasColorSelect && canvasCustomColor) {
      let previewColor;
      if (canvasColorSelect.value === "custom") {
        previewColor = canvasCustomColor.value;
      } else {
        previewColor = canvasColorSelect.value;
      }

      // Apply the color as a preview
      this.canvas.style.backgroundColor = previewColor;
    }
  }

  populateModalFields() {
    const type = this.currentElement.dataset.type;
    const contentElement = this.currentElement.querySelector("[data-content]");

    switch (type) {
      case "heading":
        document.getElementById("headingText").value =
          contentElement.textContent;
        this.setSelectValue(
          "headingSize",
          this.extractClass(contentElement, "text-"),
        );
        this.setSelectValue(
          "headingColor",
          this.extractClass(contentElement, "text-"),
        );
        this.setSelectValue(
          "headingAlign",
          this.extractClass(contentElement, "text-", [
            "left",
            "center",
            "right",
          ]),
        );
        break;

      case "text":
        document.getElementById("textContent").value =
          contentElement.textContent;
        this.setSelectValue(
          "textSize",
          this.extractClass(contentElement, "text-"),
        );
        this.setSelectValue(
          "textColor",
          this.extractClass(contentElement, "text-"),
        );
        this.setSelectValue(
          "textAlign",
          this.extractClass(contentElement, "text-", [
            "left",
            "center",
            "right",
          ]),
        );
        break;

      case "image":
        document.getElementById("imageUrl").value = contentElement.src;
        document.getElementById("imageAlt").value = contentElement.alt;
        this.setSelectValue(
          "imageWidth",
          this.extractClass(contentElement, "w-", ["full"]),
        );
        this.setSelectValue(
          "imageAlign",
          this.extractClass(contentElement, "m", [
            "x-auto",
            "r-auto",
            "l-auto",
          ]),
        );
        break;

      case "table":
        document.getElementById("tableContent").value =
          contentElement.innerHTML;
        this.setSelectValue(
          "tableBorder",
          this.extractClass(contentElement, "border"),
        );
        this.setSelectValue(
          "tableWidth",
          this.extractClass(contentElement, "w-"),
        );
        break;

      case "divider":
        this.setSelectValue(
          "dividerStyle",
          this.extractClass(contentElement, "border-"),
        );
        this.setSelectValue(
          "dividerSpacing",
          this.extractClass(contentElement, "my-"),
        );
        break;

      case "spacer":
        this.setSelectValue(
          "spacerHeight",
          this.extractClass(contentElement, "py-"),
        );
        document.getElementById("spacerVisual").value =
          contentElement.querySelector(".text-center") ? "true" : "false";
        break;

      case "list":
        const listItems = Array.from(contentElement.querySelectorAll("li"))
          .map((li) => li.textContent)
          .join("\n");
        document.getElementById("listItems").value = listItems;
        document.getElementById("listType").value =
          contentElement.tagName.toLowerCase();
        this.setSelectValue(
          "listStyle",
          this.extractClass(contentElement, "list-"),
        );
        this.setSelectValue(
          "listColor",
          this.extractClass(contentElement, "text-"),
        );
        break;

      case "button":
        document.getElementById("buttonText").value =
          contentElement.textContent;
        document.getElementById("buttonUrl").value = contentElement.href;
        this.setSelectValue(
          "buttonColor",
          this.extractClass(contentElement, "bg-"),
        );
        this.setSelectValue(
          "buttonSize",
          this.extractClass(contentElement, "px-"),
        );
        break;
    }
  }

  extractClass(element, prefix, suffixes = null) {
    const classes = element.className.split(" ");
    if (suffixes) {
      return (
        classes.find((cls) =>
          suffixes.some((suffix) => cls.includes(suffix)),
        ) || ""
      );
    }
    return classes.find((cls) => cls.startsWith(prefix)) || "";
  }

  setSelectValue(selectId, value) {
    const select = document.getElementById(selectId);
    if (select && value) {
      const option = Array.from(select.options).find((opt) =>
        opt.value.includes(value),
      );
      if (option) {
        select.value = option.value;
      }
    }
  }

  saveElementSettings() {
    if (this.currentElement) {
      const type = this.currentElement.dataset.type;
      const contentElement =
        this.currentElement.querySelector("[data-content]");

      switch (type) {
        case "heading":
          this.saveHeadingSettings(contentElement);
          break;
        case "text":
          this.saveTextSettings(contentElement);
          break;
        case "image":
          this.saveImageSettings(contentElement);
          break;
        case "button":
          this.saveButtonSettings(contentElement);
          break;
        case "table":
          this.saveTableSettings(contentElement);
          break;
        case "divider":
          this.saveDividerSettings(contentElement);
          break;
        case "spacer":
          this.saveSpacerSettings(contentElement);
          break;
        case "list":
          this.saveListSettings(contentElement);
          break;
      }
    } else {
      // Canvas settings
      this.saveCanvasSettings();
    }

    this.closeModal();
    this.saveToLocalStorage();
  }

  saveCanvasSettings() {
    const canvasColorSelect = document.getElementById("canvasBackgroundColor");
    const canvasCustomColor = document.getElementById("canvasCustomColor");

    if (canvasColorSelect && canvasCustomColor) {
      if (canvasColorSelect.value === "custom") {
        this.canvasBackgroundColor = canvasCustomColor.value;
      } else {
        this.canvasBackgroundColor = canvasColorSelect.value;
      }

      this.canvas.style.backgroundColor = this.canvasBackgroundColor;
    }
  }

  saveHeadingSettings(element) {
    const text = document.getElementById("headingText").value;
    const size = document.getElementById("headingSize").value;
    const colorSelect = document.getElementById("headingColor");
    const customColor = document.getElementById("headingCustomColor");
    const align = document.getElementById("headingAlign").value;

    let color;
    if (colorSelect.value === "custom") {
      color = "";
      element.style.color = customColor.value;
    } else {
      color = colorSelect.value;
      element.style.color = "";
    }

    element.textContent = text;
    element.className = `font-bold ${size} ${color} ${align}`;
  }

  saveTextSettings(element) {
    const text = document.getElementById("textContent").value;
    const size = document.getElementById("textSize").value;
    const colorSelect = document.getElementById("textColor");
    const customColor = document.getElementById("textCustomColor");
    const align = document.getElementById("textAlign").value;

    let color;
    if (colorSelect.value === "custom") {
      color = "";
      element.style.color = customColor.value;
    } else {
      color = colorSelect.value;
      element.style.color = "";
    }

    element.textContent = text;
    element.className = `leading-relaxed ${size} ${color} ${align}`;
  }

  saveImageSettings(element) {
    const url = document.getElementById("imageUrl").value;
    const alt = document.getElementById("imageAlt").value;
    const width = document.getElementById("imageWidth").value;
    const align = document.getElementById("imageAlign").value;

    element.src = url;
    element.alt = alt;
    element.className = `${width} ${align} rounded`;
  }

  saveButtonSettings(element) {
    const text = document.getElementById("buttonText").value;
    const url = document.getElementById("buttonUrl").value;
    const colorSelect = document.getElementById("buttonColor");
    const customColor = document.getElementById("buttonCustomColor");
    const size = document.getElementById("buttonSize").value;

    let color;
    if (colorSelect.value === "custom") {
      color = "";
      element.style.backgroundColor = customColor.value;
      element.style.borderColor = customColor.value;
    } else {
      color = colorSelect.value;
      element.style.backgroundColor = "";
      element.style.borderColor = "";
    }

    element.textContent = text;
    element.href = url;
    element.className = `inline-block ${color} text-white ${size} rounded-lg transition-colors`;
  }

  saveTableSettings(element) {
    const content = document.getElementById("tableContent").value;
    const border = document.getElementById("tableBorder").value;
    const width = document.getElementById("tableWidth").value;

    element.innerHTML = content;
    element.className = `${width} border-collapse ${border}`;
  }

  saveDividerSettings(element) {
    const style = document.getElementById("dividerStyle").value;
    const spacing = document.getElementById("dividerSpacing").value;

    element.className = `${style} ${spacing}`;
  }

  saveSpacerSettings(element) {
    const height = document.getElementById("spacerHeight").value;
    const showVisual = document.getElementById("spacerVisual").value === "true";

    element.className = height;

    if (showVisual) {
      const heightMap = {
        "py-2": "16px",
        "py-4": "32px",
        "py-6": "48px",
        "py-8": "64px",
        "py-12": "96px",
      };
      element.innerHTML = `<div class="text-center text-gray-400 text-sm">Spacer (${heightMap[height] || "32px"})</div>`;
    } else {
      element.innerHTML = "";
    }
    element.style.backgroundColor = "transparent";
  }

  saveListSettings(element) {
    const items = document
      .getElementById("listItems")
      .value.split("\n")
      .filter((item) => item.trim());
    const listType = document.getElementById("listType").value;
    const style = document.getElementById("listStyle").value;
    const colorSelect = document.getElementById("listColor");
    const customColor = document.getElementById("listCustomColor");

    let color;
    if (colorSelect.value === "custom") {
      color = "";
      element.style.color = customColor.value;
    } else {
      color = colorSelect.value;
      element.style.color = "";
    }

    // Change list type if needed
    if (element.tagName.toLowerCase() !== listType) {
      const newElement = document.createElement(listType);
      newElement.className = element.className;
      newElement.setAttribute("data-content", "");
      if (element.style.color) {
        newElement.style.color = element.style.color;
      }
      element.parentNode.replaceChild(newElement, element);
      element = newElement;
    }

    element.className = `${style} ${color}`;
    element.innerHTML = items.map((item) => `<li>${item.trim()}</li>`).join("");
  }

  deleteElement(elementId) {
    const element = document.getElementById(elementId);
    element.remove();

    // Show empty state if no elements left
    if (this.canvas.children.length === 0) {
      this.clearCanvas();
    }
    this.saveToLocalStorage();
  }

  closeModal() {
    this.settingsModal.classList.add("hidden");
    this.currentElement = null;
  }

  saveToLocalStorage() {
    try {
      const templateData = {
        html: this.canvas.innerHTML,
        backgroundColor: this.canvasBackgroundColor,
        elementCounter: this.elementCounter,
      };
      localStorage.setItem("emailTemplate", JSON.stringify(templateData));
    } catch (err) {
      console.error("Failed to save to localStorage:", err);
    }
  }

  loadFromLocalStorage() {
    try {
      const savedData = localStorage.getItem("emailTemplate");
      if (savedData) {
        const templateData = JSON.parse(savedData);
        this.canvas.innerHTML = templateData.html || "";
        this.canvasBackgroundColor = templateData.backgroundColor || "#ffffff";
        this.canvas.style.backgroundColor = this.canvasBackgroundColor;
        this.elementCounter = templateData.elementCounter || 0;

        // Reattach event listeners to loaded elements
        const elements = this.canvas.querySelectorAll(".element");
        elements.forEach((element) => {
          this.setupElementEvents(element.id);
          this.setupElementReordering(element.id);
        });

        // Show empty state if no elements
        if (elements.length === 0) {
          this.clearCanvas();
        }
      } else {
        this.clearCanvas();
      }
    } catch (err) {
      console.error("Failed to load from localStorage:", err);
      this.clearCanvas();
    }
  }

  generateEmailHTML() {
    // Create a clean copy of the canvas content
    const canvasClone = this.canvas.cloneNode(true);

    // Remove all element settings buttons and styling classes
    const elements = canvasClone.querySelectorAll(".element");
    elements.forEach((element) => {
      // Remove settings buttons
      const settings = element.querySelector(".element-settings");
      if (settings) settings.remove();

      // Remove element-specific classes and attributes
      element.classList.remove("element");
      element.removeAttribute("id");
      element.removeAttribute("data-type");
      element.removeAttribute("draggable");

      // Remove data attributes from content elements
      const contentElement = element.querySelector("[data-content]");
      if (contentElement) {
        contentElement.removeAttribute("data-content");
        if (contentElement.hasAttribute("data-href")) {
          contentElement.removeAttribute("data-href");
        }
      }

      // Clean up element styling for email compatibility
      element.style.position = "";
      element.style.padding = "";
      element.style.margin = "";
      element.style.border = "";
      element.style.borderRadius = "";
      element.style.background = "";
    });

    // Remove empty state if present
    const emptyState = canvasClone.querySelector("#emptyState");
    if (emptyState) emptyState.remove();

    // Generate complete HTML email template
    const emailHTML = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Email Template</title>
    <style>
        /* Email-safe CSS */
        body {
            margin: 0;
            padding: 0;
            font-family: Arial, sans-serif;
            line-height: 1.6;
            background-color: #f4f4f4;
        }
        .email-container {
            max-width: 600px;
            margin: 0 auto;
            background-color: ${this.canvasBackgroundColor};
            padding: 20px;
        }
        .text-xl { font-size: 1.25rem; }
        .text-2xl { font-size: 1.5rem; }
        .text-3xl { font-size: 1.875rem; }
        .text-4xl { font-size: 2.25rem; }
        .text-sm { font-size: 0.875rem; }
        .text-base { font-size: 1rem; }
        .text-lg { font-size: 1.125rem; }
        .font-bold { font-weight: bold; }
        .text-center { text-align: center; }
        .text-left { text-align: left; }
        .text-right { text-align: right; }
        .text-gray-700 { color: #374151; }
        .text-gray-800 { color: #1f2937; }
        .text-black { color: #000000; }
        .text-indigo-600 { color: #4f46e5; }
        .text-blue-600 { color: #2563eb; }
        .text-green-600 { color: #059669; }
        .text-red-600 { color: #dc2626; }
        .leading-relaxed { line-height: 1.625; }
        .w-full { width: 100%; }
        .max-w-xs { max-width: 20rem; }
        .max-w-sm { max-width: 24rem; }
        .max-w-md { max-width: 28rem; }
        .max-w-lg { max-width: 32rem; }
        .max-w-xl { max-width: 36rem; }
        .mx-auto { margin-left: auto; margin-right: auto; }
        .mr-auto { margin-right: auto; }
        .ml-auto { margin-left: auto; }
        .rounded { border-radius: 0.25rem; }
        .rounded-lg { border-radius: 0.5rem; }
        .inline-block { display: inline-block; }
        .px-4 { padding-left: 1rem; padding-right: 1rem; }
        .px-6 { padding-left: 1.5rem; padding-right: 1.5rem; }
        .px-8 { padding-left: 2rem; padding-right: 2rem; }
        .py-2 { padding-top: 0.5rem; padding-bottom: 0.5rem; }
        .py-3 { padding-top: 0.75rem; padding-bottom: 0.75rem; }
        .py-4 { padding-top: 1rem; padding-bottom: 1rem; }
        .bg-indigo-600 { background-color: #4f46e5; }
        .bg-blue-600 { background-color: #2563eb; }
        .bg-green-600 { background-color: #059669; }
        .bg-red-600 { background-color: #dc2626; }
        .bg-purple-600 { background-color: #9333ea; }
        .bg-gray-600 { background-color: #4b5563; }
        .text-white { color: #ffffff; }
        a { color: inherit; text-decoration: none; }
        img { max-width: 100%; height: auto; display: block; }
        div { margin: 8px 0; }
        /* Table styles */
        table { border-collapse: collapse; width: 100%; }
        .w-3/4 { width: 75%; }
        .w-1/2 { width: 50%; }
        .w-1/3 { width: 33.333333%; }
        th, td { padding: 0.5rem 1rem; }
        .border { border: 1px solid; }
        .border-0 { border: none; }
        .border-gray-300 { border-color: #d1d5db; }
        .border-black { border-color: #000000; }
        .border-blue-300 { border-color: #93c5fd; }
        .border-green-300 { border-color: #86efac; }
        .bg-gray-100 { background-color: #f3f4f6; }
        /* Divider styles */
        hr { margin: 0; padding: 0; }
        .border-t { border-top-width: 1px; }
        .border-t-2 { border-top-width: 2px; }
        .border-t-4 { border-top-width: 4px; }
        .border-dashed { border-style: dashed; }
        .border-gray-400 { border-color: #9ca3af; }
        .border-indigo-500 { border-color: #6366f1; }
        .border-red-400 { border-color: #f87171; }
        .border-green-400 { border-color: #4ade80; }
        .border-blue-400 { border-color: #60a5fa; }
        .my-2 { margin-top: 0.5rem; margin-bottom: 0.5rem; }
        .my-4 { margin-top: 1rem; margin-bottom: 1rem; }
        .my-6 { margin-top: 1.5rem; margin-bottom: 1.5rem; }
        .my-8 { margin-top: 2rem; margin-bottom: 2rem; }
        /* Spacer styles */
        .py-2 { padding-top: 0.5rem; padding-bottom: 0.5rem; }
        .py-6 { padding-top: 1.5rem; padding-bottom: 1.5rem; }
        .py-12 { padding-top: 3rem; padding-bottom: 3rem; }
        /* List styles */
        .list-disc { list-style-type: disc; }
        .list-decimal { list-style-type: decimal; }
        .list-square { list-style-type: square; }
        .list-none { list-style-type: none; }
        .list-inside { list-style-position: inside; }
        ul, ol { margin: 0; padding-left: 1.25rem; }
    </style>
</head>
<body>
    <div class="email-container">
        ${canvasClone.innerHTML}
    </div>
</body>
</html>`;

    return emailHTML;
  }

  async copyTemplateToClipboard() {
    try {
      const emailHTML = this.generateEmailHTML();
      await navigator.clipboard.writeText(emailHTML);

      // Show success feedback
      this.showNotification("Template copied to clipboard!", "success");
    } catch (err) {
      console.error("Failed to copy template: ", err);
      // Fallback for older browsers
      try {
        const textArea = document.createElement("textarea");
        textArea.value = this.generateEmailHTML();
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
        this.showNotification("Template copied to clipboard!", "success");
      } catch (fallbackErr) {
        this.showNotification(
          "Failed to copy template. Please try again.",
          "error",
        );
      }
    }
  }

  showNotification(message, type = "success") {
    // Create notification element
    const notification = document.createElement("div");
    notification.className = `fixed top-4 right-4 px-6 py-3 rounded-lg text-white z-50 transition-all duration-300 transform translate-x-full`;
    notification.className +=
      type === "success" ? " bg-green-500" : " bg-red-500";
    notification.textContent = message;

    document.body.appendChild(notification);

    // Animate in
    setTimeout(() => {
      notification.classList.remove("translate-x-full");
    }, 100);

    // Animate out and remove
    setTimeout(() => {
      notification.classList.add("translate-x-full");
      setTimeout(() => {
        if (document.body.contains(notification)) {
          document.body.removeChild(notification);
        }
      }, 300);
    }, 3000);
  }
}

// Initialize the email builder when the page loads
document.addEventListener("DOMContentLoaded", () => {
  new EmailBuilder();
});
