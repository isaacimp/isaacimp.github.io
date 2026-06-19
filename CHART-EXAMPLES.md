# Chart Library - Usage Guide

A general-purpose chart library for displaying nutrient data. Can be used for any food-related or chemistry article.

## Design Philosophy

**Separation of Concerns:**
- `nutrition-data.js` = Pure data only (numbers, formulas, element symbols)
- `index.html` = Article content and context (explanatory text, intro, conclusions)
- `charts.js` = Reusable visualization logic

Keep data files generic and reusable. Article-specific content lives in your HTML.

## Example 1: Simple Comparison Chart

```html
<div id="my-chart"></div>

<script src="charts.js"></script>
<script>
  ChartLib.createSimpleChart('my-chart', {
    foods: ['Potato', 'Sweet Potato', 'Carrots'],
    tabs: {
      vitamins: {
        label: 'Vitamins',
        groups: {
          'Vitamin A': {
            unit: 'µg RAE',
            rda: 900,
            values: [0, 709, 835]  // Order matches foods array
          },
          'Vitamin C': {
            unit: 'mg',
            rda: 90,
            values: [19.7, 2.4, 5.9]
          }
        }
      }
    }
  });
</script>
```

## Example 2: Completeness Chart with Chemical Formulas

```html
<div id="nutrient-table"></div>

<script src="charts.js"></script>
<script>
  const myNutrients = [
    { label: 'Vitamin C', value: 39, unit: 'mg', category: 'Vitamins', formula: 'C6H8O6' },
    { label: 'Potassium', value: 850, unit: 'mg', category: 'Minerals', element: 'K' },
    { label: 'Fiber', value: 4.6, unit: 'g', category: 'Macros', formula: null }
  ];

  ChartLib.createCompletenessChart('nutrient-table', myNutrients);
</script>
```

**Note:** This displays nutrients in a clean table with chemical formulas. Article-specific explanatory text should be in your HTML, not in the data array.

## Example 3: Multiple Tabs

```javascript
ChartLib.createSimpleChart('my-chart', {
  foods: ['Food A', 'Food B', 'Food C'],
  tabs: {
    macros: {
      label: 'Macros',
      groups: {
        'Protein': {
          unit: 'g',
          values: [10, 5, 15]
        },
        'Fat': {
          unit: 'g',
          values: [2, 8, 3]
        }
      }
    },
    minerals: {
      label: 'Minerals',
      groups: {
        'Iron': {
          unit: 'mg',
          rda: 18,
          values: [2.5, 1.0, 3.5]
        }
      }
    }
  }
});
```

## To Add New Foods or Nutrients:

### Option 1: Edit `nutrition-data.js`

Just add values to the arrays in the right order:

```javascript
'Vitamin C': {
  unit: 'mg',
  rda: 90,
  values: [19.7, 8.7, 0.0, 0.0, 0.0]  // Add new value at end
}
```

### Option 2: Create New Data File

Create a new file like `my-food-data.js`:

```javascript
const appleData = {
  foods: ['Apple', 'Orange', 'Grape'],
  tabs: {
    vitamins: {
      label: 'Vitamins',
      groups: {
        'Vitamin C': { unit: 'mg', rda: 90, values: [4.6, 53.2, 3.2] }
      }
    }
  }
};
```

Then use it:

```html
<script src="my-food-data.js"></script>
<script>
  ChartLib.createSimpleChart('apple-chart', appleData);
</script>
```

## Benefits of This System:

1. **No HTML to write** - just define data
2. **Easy to update** - change one number in the array
3. **Consistent styling** - all charts look the same
4. **Reusable** - create as many charts as you want for different articles
5. **Simple** - no build tools needed!
6. **Data/Content Separation** - data files are generic, article text stays in HTML

## Best Practices:

### ✅ DO: Keep data files pure
```javascript
const appleData = [
  { label: 'Vitamin C', value: 5.7, unit: 'mg', category: 'Vitamins', formula: 'C6H8O6' },
  { label: 'Potassium', value: 107, unit: 'mg', category: 'Minerals', element: 'K' }
];
```

### ❌ DON'T: Mix article content into data
```javascript
// BAD - don't do this
const appleData = {
  intro: "Apples are amazing fruits that...",  // Article content doesn't belong here
  note: "As you can see, apples...",           // This should be in your HTML
  nutrients: [...]
};
```

### ✅ DO: Put article text in HTML
```html
<p>Apples are amazing fruits that provide several key nutrients.</p>
<div id="apple-chart"></div>
<p class="note">As you can see, apples are a good source of fiber.</p>
```

This keeps your data files reusable across different articles!

## Tips:

- Keep foods in consistent order across all nutrients
- Use `null` for missing data (like pasta amino acids)
- RDA is optional - charts work without it
- Values should be per 100g for consistency
