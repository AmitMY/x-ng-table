# x-ng-table
AngularJS service built around esvit/ng-table, with extra features

### AWFUL CODING - GREAT FUNCTIONALITY.
Please help make it better!

## Usage
```js
    angular.module('yourApp',['xNgTable'])
    .controller('yourContreller', function($scope, xNgTable) {
        $scope.xNgTable = new xNgTable({
           /*Parameters Object*/
        });
    }
```

## Dependencies
- esvit/ng-table
- jQuery (will try to remove)
- Angular (of course)
- Bootstrap (CSS+JS)
- moment.js

## This service includes
- Select/Deselect Rows options (selectable = true)
    - Ctrl+click to select multiple rows
    - Option to add a condition for disabled rows
    - Select/Deselect All rows
- Select Cells option
    - When a cell is selected, CTRL+C will copy it.
- Row triggers:
    - Click
    - Double Click
    - Ctrl + Click
    - Ctrl + Double Click
- Delete row action
- Offline data mode (filters & order)
- Online data mode (filters & order)
- Filters can be shown inside or outside the table
- Public methods can be shown in a dropdown, or in a line of buttons

## New filters
- Global filter to filter all fields
- Number filter to allow only numbers
- Boolean bootstrap switch
- Daterange filter
- Select from a dataList
- Multiselect from a list
- Multiselect from a dataList
* `I define dataList as a scoped object containing lists of data.`

## Public methods on selected rows
- Export as CSV (Will export any selection as csv, but will encode several characters like '#')
- Custom public table methods

## Private methods
- Add rows
- Delete rows

## Parameters
| Parameter | Default | Type | Description |
| --------|---------|-------|-------|
| scope | null | Object | Your scope (will be removed) |
| global_filter | false | Boolean | When true, allows a global search filter for the table |
| selectable | "selected" | false, STRING | When not false, it will use the name provided (String) as the "tick" attribute |
| class | "table-striped table-bordered table-hover" | STRING | What classes will the table have |
| dropdown_actions | true | Boolean | When true, the actions will show in a dropdown. When false, using buttons |
| copy_text | true | Boolean | Allows/Disallows copying a cell using CTRL+C |
| selection_rule | function() {return true} | Function | Determines which rows are disabled for selection |
| default_filter | {} | Object | If you want to determine any default value for a filter, pass it here |
| data | [] | Array | Array of columns. Columns Object is explained in the next table |
| url | null | String | If data needs to be fetched from an API, pass url here. Data format: {status: bool, data: Array} |
| filter | "inside" | String("inside","outside") | When "inside" will show the filters inside the table. When "outside" will show them outside|
| filter_data_backend | false | Boolean | Do you want to filter & order your data in the back end? (if you have a LIMIT in what you show, it should be true)|
| actions | [] | Array | Array of public xNgTable actions that you want to show. Example: {title: 'Export to CSV', action: 'export_selected_csv'}|
| actions_list | [] | Array | Array of your actions that you want to show. Example: {title: "Delete Selected", action: function() {}, type:"danger"}|
| addRow | false | Boolean | Does not work in this version |
| rowTitle | "" | String | Does not work in this version |
| delete | false | false, String | is this deletable? if so, write the field name |
| row_click | null | Function(row) | What to do on row click? |
| row_click_ctrl | null | Function(row) | What to do on row click with ctrl? |
| row_2click | null | Function(row) | What to do on row double click? |
| row_2click_ctrl | null | Function(row) | What to do on row double click with ctrl? |

## Column Format
| Parameter | Type  | Description |
| --------|---------|-------|
| title | String | Column's title |
| sortable | String | ng-table's Sortable field |
| field | String  | Field's name in the data |
| filter | {field's name: filter_name} | What filter to apply on what column |
| multiselect | {list: String, id: 'key', title: 'val'}} | (Mandatory when filter is multiselect_datalist, or select_datalist) |
| filterData | [{id: "key", title: "val"}...] | (Mandatory when filter is select) |
| type | String | (Not mandatory) If your data is HTML, write "html" |
| style | Object | (Not mandatory) Style object angular-style {property: value} |
| function | Function(row) | (Not mandatory) Manipulate the data you are showing using a function |

## Filters (Can utilize normal ng-table filters as well)
| Name | Description |
| --------|---------|
| number | Number input |
| dates_range | Dates range select |
| bool | Boolean bootstrap switch |
| multiselect_dataList | Multiselect from a dataList parameter |
| select_dataList | Select from a dataList parameter |

## Things missing
- Trinary filter (the binary one does not have a nutral option)
- Fixed header (as it is a \<table\> it is hard)
- Pinned columns (as it is a \<table\> it is hard)
- Better responsivity (the \<table\> clips out)