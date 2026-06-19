/**
 * Nutrition data for potato comparisons
 * All values per 100g
 * Source: USDA FoodData Central
 */

const nutritionData = {
  // Foods being compared
  foods: ['Potato', 'Banana', 'Eggs', 'Rice', 'Pasta'],

  // All nutrients in a potato - showing completeness
  // Values for 500g (one large potato meal) = ~385 calories
  // Per100Cal shows amount per 100 calories (for nutrient density comparison)
  allNutrients: [
    // Macronutrients
    { label: 'Protein', value: 10, unit: 'g', per100cal: 2.6, category: 'Macros', formula: 'Complete', rda: 50 },
    { label: 'Carbohydrates', value: 87.5, unit: 'g', per100cal: 22.7, category: 'Macros', formula: 'Starch, Fiber, Simple sugars', rda: 300 },
    { label: 'Fat', value: 0.5, unit: 'g', per100cal: 0.1, category: 'Macros', pubchem: null, rda: 70 },

    // Minerals (element symbols for display)
    { label: 'Potassium', value: 2125, unit: 'mg', per100cal: 552, category: 'Minerals', element: 'K', rda: 3400 },
    { label: 'Copper', value: 0.55, unit: 'mg', per100cal: 0.14, category: 'Minerals', element: 'Cu', rda: 0.9 },
    { label: 'Phosphorus', value: 285, unit: 'mg', per100cal: 74, category: 'Minerals', element: 'P', rda: 700 },
    { label: 'Manganese', value: 0.75, unit: 'mg', per100cal: 0.19, category: 'Minerals', element: 'Mn', rda: 2.3 },
    { label: 'Magnesium', value: 115, unit: 'mg', per100cal: 30, category: 'Minerals', element: 'Mg', rda: 400 },
    { label: 'Iron', value: 4, unit: 'mg', per100cal: 1.0, category: 'Minerals', element: 'Fe', rda: 18 },
    { label: 'Zinc', value: 1.5, unit: 'mg', per100cal: 0.39, category: 'Minerals', element: 'Zn', rda: 11 },
    { label: 'Calcium', value: 60, unit: 'mg', per100cal: 16, category: 'Minerals', element: 'Ca', rda: 1000 },
    { label: 'Selenium', value: 2, unit: 'µg', per100cal: 0.5, category: 'Minerals', element: 'Se', rda: 55 },
    { label: 'Sodium', value: 1230, unit: 'mg', per100cal: 320, category: 'Minerals', element: 'Na', rda: 2300 }, // Includes typical salt added to 500g potatoes

    // Vitamins (with molecular formulas)
    { label: 'Vitamin C', value: 98.5, unit: 'mg', per100cal: 25.6, category: 'Vitamins', formula: 'C6H8O6', rda: 90 },
    { label: 'Vitamin B6', value: 1.5, unit: 'mg', per100cal: 0.39, category: 'Vitamins', formula: 'C8H11NO3', rda: 1.7 },
    { label: 'Niacin (B3)', value: 5.5, unit: 'mg', per100cal: 1.4, category: 'Vitamins', formula: 'C6H5NO2', rda: 16 },
    { label: 'Thiamin (B1)', value: 0.4, unit: 'mg', per100cal: 0.10, category: 'Vitamins', formula: 'C12H17N4OS', rda: 1.2 },
    { label: 'Pantothenic (B5)', value: 1.5, unit: 'mg', per100cal: 0.39, category: 'Vitamins', formula: 'C9H17NO5', rda: 5 },
    { label: 'Folate (B9)', value: 75, unit: 'µg', per100cal: 19.5, category: 'Vitamins', formula: 'C19H19N7O6', rda: 400 },
    { label: 'Riboflavin (B2)', value: 0.15, unit: 'mg', per100cal: 0.04, category: 'Vitamins', formula: 'C17H20N4O6', rda: 1.3 },
    { label: 'Choline', value: 60.5, unit: 'mg', per100cal: 15.7, category: 'Vitamins', formula: 'C5H14NO', rda: 550 },
    { label: 'Vitamin K', value: 10, unit: 'µg', per100cal: 2.6, category: 'Vitamins', formula: 'C31H46O2', rda: 120 },
    { label: 'Vitamin E', value: 0.05, unit: 'mg', per100cal: 0.01, category: 'Vitamins', formula: 'C29H50O2', rda: 15 },
    { label: 'Vitamin A', value: 0, unit: 'µg', per100cal: 0, category: 'Vitamins', formula: 'C20H30O', rda: 900 },
    { label: 'Vitamin D', value: 0, unit: 'µg', per100cal: 0, category: 'Vitamins', formula: 'C27H44O', rda: 20 },
    { label: 'Vitamin B12', value: 0, unit: 'µg', per100cal: 0, category: 'Vitamins', formula: 'C63H88CoN14O14P', rda: 2.4 },

    // Essential Amino Acids (with molecular formulas)
    { label: 'Leucine', value: 325, unit: 'mg', per100cal: 84, category: 'Amino Acids', formula: 'C6H13NO2', rda: 2730 },
    { label: 'Lysine', value: 312, unit: 'mg', per100cal: 81, category: 'Amino Acids', formula: 'C6H14N2O2', rda: 2100 },
    { label: 'Valine', value: 300, unit: 'mg', per100cal: 78, category: 'Amino Acids', formula: 'C5H11NO2', rda: 1820 },
    { label: 'Isoleucine', value: 230, unit: 'mg', per100cal: 60, category: 'Amino Acids', formula: 'C6H13NO2', rda: 1400 },
    { label: 'Threonine', value: 205, unit: 'mg', per100cal: 53, category: 'Amino Acids', formula: 'C4H9NO3', rda: 1050 },
    { label: 'Phenylalanine', value: 400, unit: 'mg', per100cal: 104, category: 'Amino Acids', formula: 'C9H11NO2', rda: 1750 },
    { label: 'Histidine', value: 105, unit: 'mg', per100cal: 27, category: 'Amino Acids', formula: 'C6H9N3O2', rda: 700 },
    { label: 'Tryptophan', value: 45, unit: 'mg', per100cal: 12, category: 'Amino Acids', formula: 'C11H12N2O2', rda: 280 },
    { label: 'Methionine', value: 80, unit: 'mg', per100cal: 21, category: 'Amino Acids', formula: 'C5H11NO2S', rda: 1050 }
  ],

  // Complete chart data organized by tabs
  tabs: {
    // MACROS TAB
    macros: {
      label: 'Macros',
      groups: {
        'Calories': {
          unit: 'kcal',
          values: [77, 89, 143, 127, 149]
        },
        'Carbohydrates': {
          unit: 'g',
          values: [17.5, 22.8, 1.1, 27.7, 26.1]
        },
        'Fiber': {
          unit: 'g',
          rda: 25,
          values: [2.3, 2.6, 0.0, 0.4, 1.8]
        },
        'Protein': {
          unit: 'g',
          values: [2.0, 1.1, 12.6, 2.7, 5.8]
        },
        'Fat': {
          unit: 'g',
          values: [0.1, 0.3, 9.5, 0.3, 0.9]
        }
      }
    },

    // MINERALS TAB
    minerals: {
      label: 'Minerals',
      groups: {
        'Potassium': {
          unit: 'mg',
          rda: 3400,
          values: [425, 358, 138, 35, 24]
        },
        'Magnesium': {
          unit: 'mg',
          rda: 400,
          values: [23, 27, 12, 12, 18]
        },
        'Phosphorus': {
          unit: 'mg',
          rda: 700,
          values: [57, 22, 198, 43, 68]
        },
        'Iron': {
          unit: 'mg',
          rda: 18,
          values: [0.8, 0.3, 1.8, 0.2, 1.3]
        },
        'Zinc': {
          unit: 'mg',
          rda: 11,
          values: [0.3, 0.2, 1.3, 0.5, 0.5]
        },
        'Copper': {
          unit: 'mg',
          rda: 0.9,
          values: [0.11, 0.08, 0.07, 0.06, 0.05]
        },
        'Selenium': {
          unit: 'µg',
          rda: 55,
          values: [0.4, 1.0, 30.8, 7.5, 13.2]
        },
        'Manganese': {
          unit: 'mg',
          rda: 2.3,
          values: [0.15, 0.3, 0.03, 0.5, 0.3]
        },
        'Calcium': {
          unit: 'mg',
          rda: 1000,
          values: [12, 5, 56, 10, 7]
        },
        'Sodium': {
          unit: 'mg',
          rda: 2300,
          values: [6, 1, 142, 1, 1]
        }
      }
    },

    // VITAMINS TAB
    vitamins: {
      label: 'Vitamins',
      groups: {
        'Vitamin C': {
          unit: 'mg',
          rda: 90,
          values: [19.7, 8.7, 0.0, 0.0, 0.0]
        },
        'Vitamin B6': {
          unit: 'mg',
          rda: 1.7,
          values: [0.30, 0.37, 0.12, 0.14, 0.05]
        },
        'Folate': {
          unit: 'µg',
          rda: 400,
          values: [15, 20, 44, 3, 18]
        },
        'Thiamin (B1)': {
          unit: 'mg',
          rda: 1.2,
          values: [0.08, 0.03, 0.04, 0.02, 0.06]
        },
        'Niacin (B3)': {
          unit: 'mg',
          rda: 16,
          values: [1.1, 0.7, 0.08, 0.4, 1.3]
        },
        'Riboflavin (B2)': {
          unit: 'mg',
          rda: 1.3,
          values: [0.03, 0.07, 0.46, 0.01, 0.04]
        },
        'Vitamin B12': {
          unit: 'µg',
          rda: 2.4,
          values: [0.0, 0.0, 1.1, 0.0, 0.0]
        },
        'Vitamin A': {
          unit: 'µg RAE',
          rda: 900,
          values: [0, 3, 160, 0, 0]
        },
        'Vitamin D': {
          unit: 'µg',
          rda: 20,
          values: [0.0, 0.0, 2.0, 0.0, 0.0]
        },
        'Vitamin E': {
          unit: 'mg',
          rda: 15,
          values: [0.01, 0.1, 1.0, 0.0, 0.05]
        },
        'Pantothenic Acid (B5)': {
          unit: 'mg',
          rda: 5,
          values: [0.3, 0.3, 1.4, 0.04, 0.1]
        },
        'Choline': {
          unit: 'mg',
          rda: 550,
          values: [12.1, 9.8, 294, 2.1, 6.0]
        }
      }
    },

    // AMINO ACIDS TAB
    amino: {
      label: 'Amino Acids',
      groups: {
        'Leucine': {
          unit: 'mg',
          rda: 2730,
          values: [130, 80, 1075, 214, null]
        },
        'Lysine': {
          unit: 'mg',
          rda: 2100,
          values: [125, 52, 820, 92, null]
        },
        'Methionine + Cysteine': {
          unit: 'mg',
          rda: 1050,
          values: [32, 30, 690, 122, null]
        },
        'Phenylalanine + Tyrosine': {
          unit: 'mg',
          rda: 1750,
          values: [160, 83, 1135, 207, null]
        },
        'Threonine': {
          unit: 'mg',
          rda: 1050,
          values: [82, 31, 570, 95, null]
        },
        'Tryptophan': {
          unit: 'mg',
          rda: 280,
          values: [18, 12, 155, 34, null]
        },
        'Valine': {
          unit: 'mg',
          rda: 1820,
          values: [120, 52, 830, 148, null]
        },
        'Histidine': {
          unit: 'mg',
          rda: 700,
          values: [42, 33, 300, 56, null]
        },
        'Isoleucine': {
          unit: 'mg',
          rda: 1400,
          values: [92, 30, 670, 116, null]
        }
      }
    }
  }
};

// Make it globally available
window.nutritionData = nutritionData;

// White Rice - 2500 calorie pure rice diet
// Based on USDA data for white rice, cooked
// ~1920g cooked white rice = 2500 calories
const riceData = [
  // Macronutrients
  { label: 'Protein', value: 52, unit: 'g', category: 'Macros', rda: 50 },
  { label: 'Carbohydrates', value: 538, unit: 'g', category: 'Macros', rda: 300 },
  { label: 'Fat', value: 6, unit: 'g', category: 'Macros', rda: 70 },

  // Minerals - rice is severely deficient in most minerals
  { label: 'Potassium', value: 673, unit: 'mg', category: 'Minerals', rda: 3400 },
  { label: 'Copper', value: 1.15, unit: 'mg', category: 'Minerals', rda: 0.9 },
  { label: 'Phosphorus', value: 827, unit: 'mg', category: 'Minerals', rda: 700 },
  { label: 'Manganese', value: 9.6, unit: 'mg', category: 'Minerals', rda: 2.3 },
  { label: 'Magnesium', value: 231, unit: 'mg', category: 'Minerals', rda: 400 },
  { label: 'Iron', value: 3.8, unit: 'mg', category: 'Minerals', rda: 18 },
  { label: 'Zinc', value: 9.6, unit: 'mg', category: 'Minerals', rda: 11 },
  { label: 'Calcium', value: 192, unit: 'mg', category: 'Minerals', rda: 1000 },
  { label: 'Selenium', value: 144, unit: 'µg', category: 'Minerals', rda: 55 },
  { label: 'Sodium', value: 19, unit: 'mg', category: 'Minerals', rda: 2300 },

  // Vitamins - rice is extremely deficient in most vitamins
  { label: 'Vitamin C', value: 0, unit: 'mg', category: 'Vitamins', rda: 90 },
  { label: 'Vitamin B6', value: 2.7, unit: 'mg', category: 'Vitamins', rda: 1.7 },
  { label: 'Niacin (B3)', value: 7.7, unit: 'mg', category: 'Vitamins', rda: 16 },
  { label: 'Thiamin (B1)', value: 0.38, unit: 'mg', category: 'Vitamins', rda: 1.2 },
  { label: 'Pantothenic (B5)', value: 0.77, unit: 'mg', category: 'Vitamins', rda: 5 },
  { label: 'Folate (B9)', value: 58, unit: 'µg', category: 'Vitamins', rda: 400 },
  { label: 'Riboflavin (B2)', value: 0.19, unit: 'mg', category: 'Vitamins', rda: 1.3 },
  { label: 'Choline', value: 40, unit: 'mg', category: 'Vitamins', rda: 550 },
  { label: 'Vitamin K', value: 0, unit: 'µg', category: 'Vitamins', rda: 120 },
  { label: 'Vitamin E', value: 0, unit: 'mg', category: 'Vitamins', rda: 15 },
  { label: 'Vitamin A', value: 0, unit: 'µg', category: 'Vitamins', rda: 900 },
  { label: 'Vitamin D', value: 0, unit: 'µg', category: 'Vitamins', rda: 20 },
  { label: 'Vitamin B12', value: 0, unit: 'µg', category: 'Vitamins', rda: 2.4 },

  // Essential Amino Acids - rice protein is incomplete, low in lysine
  { label: 'Leucine', value: 4120, unit: 'mg', category: 'Amino Acids', rda: 2730 },
  { label: 'Lysine', value: 1770, unit: 'mg', category: 'Amino Acids', rda: 2100 },
  { label: 'Valine', value: 2850, unit: 'mg', category: 'Amino Acids', rda: 1820 },
  { label: 'Isoleucine', value: 2230, unit: 'mg', category: 'Amino Acids', rda: 1400 },
  { label: 'Threonine', value: 1830, unit: 'mg', category: 'Amino Acids', rda: 1050 },
  { label: 'Phenylalanine', value: 2590, unit: 'mg', category: 'Amino Acids', rda: 1750 },
  { label: 'Histidine', value: 1350, unit: 'mg', category: 'Amino Acids', rda: 700 },
  { label: 'Tryptophan', value: 660, unit: 'mg', category: 'Amino Acids', rda: 280 },
  { label: 'Methionine', value: 1460, unit: 'mg', category: 'Amino Acids', rda: 1050 }
];

window.riceData = riceData;

// Low-fat milk - per 500 calories (~1.2L)
// Used for realistic diet combinations
const milkData = {
  protein: 38,
  carbs: 58,
  fat: 5,
  potassium: 1680,
  copper: 0.1,
  phosphorus: 1080,
  manganese: 0.01,
  magnesium: 132,
  iron: 0.4,
  zinc: 4.8,
  calcium: 1440,
  selenium: 36,
  sodium: 528,
  vitaminC: 0,
  vitaminB6: 0.5,
  niacin: 1.1,
  thiamin: 0.44,
  pantothenic: 4.0,
  folate: 60,
  riboflavin: 2.2,
  choline: 192,
  vitaminK: 3.6,
  vitaminE: 0.12,
  vitaminA: 600,
  vitaminD: 6, // Fortified milk
  vitaminB12: 4.5,
  leucine: 3800,
  lysine: 3100,
  valine: 2600,
  isoleucine: 2400,
  threonine: 1800,
  phenylalanine: 1900,
  histidine: 1050,
  tryptophan: 550,
  methionine: 950
};

window.milkData = milkData;
