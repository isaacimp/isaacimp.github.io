/**
 * Simple Chart Library for Nutrition Comparisons
 * Generates HTML-based charts matching the site's design
 */

const ChartLib = {
  /**
   * Format a chemical formula with subscript numbers
   * Example: "C6H8O6" -> "C<sub>6</sub>H<sub>8</sub>O<sub>6</sub>"
   */
  _formatFormula(formula) {
    if (!formula) return '';
    return formula.replace(/(\d+)/g, '<sub>$1</sub>');
  },

  /**
   * Combine nutrients from multiple food sources
   * @param {array} baseNutrients - Base nutrient array with structure
   * @param {object} milkData - Milk nutrient data object
   * @param {number} baseCalories - Calories from base food
   * @param {number} totalBaseCalories - Total calories the base data represents
   * @param {boolean} addSunlight - Whether to add vitamin D from sunlight
   */
  _combineNutrients(baseNutrients, milkData, baseCalories, totalBaseCalories, addSunlight = false) {
    const baseMultiplier = baseCalories / totalBaseCalories;

    const nutrientMap = {
      'Protein': 'protein',
      'Carbohydrates': 'carbs',
      'Fat': 'fat',
      'Potassium': 'potassium',
      'Copper': 'copper',
      'Phosphorus': 'phosphorus',
      'Manganese': 'manganese',
      'Magnesium': 'magnesium',
      'Iron': 'iron',
      'Zinc': 'zinc',
      'Calcium': 'calcium',
      'Selenium': 'selenium',
      'Sodium': 'sodium',
      'Vitamin C': 'vitaminC',
      'Vitamin B6': 'vitaminB6',
      'Niacin (B3)': 'niacin',
      'Thiamin (B1)': 'thiamin',
      'Pantothenic (B5)': 'pantothenic',
      'Folate (B9)': 'folate',
      'Riboflavin (B2)': 'riboflavin',
      'Choline': 'choline',
      'Vitamin K': 'vitaminK',
      'Vitamin E': 'vitaminE',
      'Vitamin A': 'vitaminA',
      'Vitamin D': 'vitaminD',
      'Vitamin B12': 'vitaminB12',
      'Leucine': 'leucine',
      'Lysine': 'lysine',
      'Valine': 'valine',
      'Isoleucine': 'isoleucine',
      'Threonine': 'threonine',
      'Phenylalanine': 'phenylalanine',
      'Histidine': 'histidine',
      'Tryptophan': 'tryptophan',
      'Methionine': 'methionine'
    };

    return baseNutrients.map(nutrient => {
      const baseValue = nutrient.value * baseMultiplier;
      const milkKey = nutrientMap[nutrient.label];
      const milkValue = milkKey && milkData[milkKey] ? milkData[milkKey] : 0;

      let combinedValue = baseValue + milkValue;

      // Add sunlight vitamin D (assume 30µg from sun exposure)
      if (addSunlight && nutrient.label === 'Vitamin D') {
        combinedValue += 30;
      }

      return {
        ...nutrient,
        value: Math.round(combinedValue * 100) / 100
      };
    });
  },

  /**
   * Create a tabbed nutrition comparison chart
   * @param {string} containerId - ID of the container element
   * @param {object} data - Chart data and configuration
   */
  createTabbedChart(containerId, data) {
    const container = document.getElementById(containerId);
    if (!container) {
      console.error(`Container ${containerId} not found`);
      return;
    }

    // Generate tabs
    const tabsHtml = data.tabs.map((tab, i) =>
      `<button class="tab-btn ${i === 0 ? 'active' : ''}" data-tab="${tab.id}">${tab.label}</button>`
    ).join('');

    // Generate tab content
    const tabContentHtml = data.tabs.map((tab, i) => {
      const introHtml = tab.intro ? `<p class="section-intro" style="margin-bottom:18px;">${tab.intro}</p>` : '';
      const groupsHtml = tab.groups.map(group => this._generateGroup(group, data.foods)).join('');
      const noteHtml = tab.note ? `<p class="note" style="margin-top:24px;">${tab.note}</p>` : '';
      return `
        <div class="tab-content ${i === 0 ? 'active' : ''}" id="${tab.id}">
          ${introHtml}
          ${groupsHtml}
          ${noteHtml}
        </div>
      `;
    }).join('');

    container.innerHTML = `
      <div class="nutrient-tabs">
        ${tabsHtml}
      </div>
      ${tabContentHtml}
    `;

    // Add tab switching functionality
    container.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const targetTab = btn.dataset.tab;

        // Update button states
        container.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        // Update content visibility
        container.querySelectorAll('.tab-content').forEach(content => {
          content.classList.remove('active');
        });
        container.querySelector(`#${targetTab}`).classList.add('active');
      });
    });
  },

  /**
   * Create a comprehensive nutrient completeness chart
   * Shows all nutrients grouped by category with density bars
   * @param {string} containerId - ID of the container element
   * @param {array} nutrients - Array of {label, value, unit, per100cal, category}
   */
  createCompletenessChart(containerId, nutrients) {
    const container = document.getElementById(containerId);
    if (!container) {
      console.error(`Container ${containerId} not found`);
      return;
    }

    // Group nutrients by category
    const grouped = {};
    nutrients.forEach(nutrient => {
      if (!grouped[nutrient.category]) {
        grouped[nutrient.category] = [];
      }
      grouped[nutrient.category].push(nutrient);
    });

    const categoryOrder = ['Macros', 'Minerals', 'Vitamins', 'Amino Acids'];

    const categoriesHtml = categoryOrder.map((category, idx) => {
      if (!grouped[category]) return '';

      const itemsHtml = grouped[category].map(nutrient => {
        const totalDisplay = nutrient.value > 0
          ? `${nutrient.value}${nutrient.unit}`
          : '—';

        // Generate structure display
        let structureDisplay = '';
        if (nutrient.element) {
          // Mineral - show element symbol
          structureDisplay = `<span class="element-symbol">${nutrient.element}</span>`;
        } else if (nutrient.formula) {
          // Vitamin/Amino Acid - show molecular formula with subscripts
          const formattedFormula = this._formatFormula(nutrient.formula);
          structureDisplay = `<span class="molecular-formula">${formattedFormula}</span>`;
        } else {
          structureDisplay = '<span class="no-structure">—</span>';
        }

        return `
          <div class="nutrient-row">
            <span class="nutrient-label">${nutrient.label}</span>
            <span class="nutrient-total">${totalDisplay}</span>
            <span class="nutrient-structure">${structureDisplay}</span>
          </div>
        `;
      }).join('');

      // Add column headers only for first category
      const headerRow = idx === 0 ? `
        <div class="nutrient-row nutrient-header">
          <span class="nutrient-label">Nutrient</span>
          <span class="nutrient-total">Amount</span>
          <span class="nutrient-structure">Structure</span>
        </div>
      ` : '';

      return `
        <div class="nutrient-category">
          <h4 class="category-header">${category}</h4>
          ${headerRow}
          ${itemsHtml}
        </div>
      `;
    }).join('');

    container.innerHTML = `
      <div class="completeness-chart">
        ${categoriesHtml}
      </div>
    `;
  },

  /**
   * Generate a single nutrient group (internal helper)
   */
  _generateGroup(group, foods) {
    const maxValue = Math.max(...Object.values(group.values).map(v => v.value));

    // Sort foods by value (descending)
    const sortedFoods = Object.entries(group.values)
      .sort((a, b) => b[1].value - a[1].value);

    const rowsHtml = sortedFoods.map(([food, data]) => {
      const widthPercent = maxValue > 0 ? (data.value / maxValue * 100) : 0;
      const isPotato = food.toLowerCase() === 'potato';
      const percentText = data.rdaPercent ? `<span class="percent">${data.rdaPercent}%</span>` : '';

      return `
        <div class="row ${isPotato ? 'potato' : ''}">
          <span class="name">${food}</span>
          <div class="track">
            <div class="fill" style="width:${widthPercent}%"></div>
          </div>
          <span class="val">${data.value} ${percentText}</span>
        </div>
      `;
    }).join('');

    const rdaText = group.rda ? ` — RDA: ${group.rda}` : '';

    return `
      <div class="group">
        <h4>${group.name} <span class="rda">(${group.unit})${rdaText}</span></h4>
        ${rowsHtml}
      </div>
    `;
  },

  /**
   * Helper to calculate RDA percentage
   */
  calculateRDAPercent(value, rda) {
    if (!rda || rda === 0) return null;
    return Math.round((value / rda) * 100);
  },

  /**
   * Create chart from simple data format
   * Automatically calculates percentages and generates complete chart
   */
  createSimpleChart(containerId, config) {
    const data = {
      foods: config.foods || ['Potato', 'Banana', 'Eggs', 'Rice', 'Pasta'],
      tabs: []
    };

    // Convert simple format to full format
    Object.entries(config.tabs).forEach(([tabId, tabData]) => {
      const groups = Object.entries(tabData.groups).map(([nutrientName, nutrientData]) => {
        const values = {};

        config.foods.forEach((food, i) => {
          const value = nutrientData.values[i];
          values[food] = {
            value: value,
            rdaPercent: nutrientData.rda ? this.calculateRDAPercent(value, nutrientData.rda) : null
          };
        });

        return {
          name: nutrientName,
          unit: nutrientData.unit,
          rda: nutrientData.rda || null,
          values: values
        };
      });

      data.tabs.push({
        id: tabId,
        label: tabData.label,
        groups: groups
      });
    });

    this.createTabbedChart(containerId, data);
  },

  /**
   * Create a compact GitHub-style heatmap showing nutrient completeness
   * @param {string} containerId - ID of the container element
   * @param {array} nutrients - Array of nutrient objects with value and rda
   * @param {number} targetCalories - Target daily calories (e.g., 2500)
   * @param {number} currentCalories - Calories in current serving (e.g., 385 for 500g)
   */
  createNutrientHeatmap(containerId, nutrients, targetCalories = 2500, currentCalories = 385) {
    const container = document.getElementById(containerId);
    if (!container) {
      console.error(`Container ${containerId} not found`);
      return;
    }

    // Calculate multiplier to scale up to target calories
    const multiplier = targetCalories / currentCalories;

    // Create cells for all nutrients
    const cellsHtml = nutrients.map(nutrient => {
      // Calculate scaled value and RDA percentage
      const scaledValue = nutrient.value * multiplier;
      const rdaPercent = nutrient.rda ? (scaledValue / nutrient.rda * 100) : 0;

      // Determine level (0-4) based on RDA percentage - GitHub style
      let level = 0;
      if (rdaPercent === 0) {
        level = 0;
      } else if (rdaPercent < 25) {
        level = 1;
      } else if (rdaPercent < 50) {
        level = 2;
      } else if (rdaPercent < 75) {
        level = 3;
      } else {
        level = 4;
      }

      const percentDisplay = Math.round(rdaPercent);
      const shortLabel = nutrient.label.replace(' (B', '(B').replace('Pantothenic', 'B5').replace('Phenylalanine', 'Phe');
      const valueDisplay = Math.round(scaledValue * 10) / 10; // Round to 1 decimal

      return `<div class="heatmap-cell" data-level="${level}" data-nutrient="${shortLabel}" data-percent="${percentDisplay}" data-value="${valueDisplay}" data-unit="${nutrient.unit}"></div>`;
    }).join('');

    container.innerHTML = `
      <div class="nutrient-heatmap">
        ${cellsHtml}
      </div>
      <div class="heatmap-legend">
        <span>Less</span>
        <div class="legend-scale">
          <div class="legend-cell" data-level="0"></div>
          <div class="legend-cell" data-level="1"></div>
          <div class="legend-cell" data-level="2"></div>
          <div class="legend-cell" data-level="3"></div>
          <div class="legend-cell" data-level="4"></div>
        </div>
        <span>More</span>
      </div>
    `;
  }
};

// Make it globally available
window.ChartLib = ChartLib;
