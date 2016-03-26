var xNgTable = angular.module('xNgTable', ["ngTable"/*, 'ngBootstrap'*/]);

/**
 * @ngdoc service
 * @name xNgTable.xNgTable
 * @requires $http
 * @requires ngTableParams
 * @requires $filter
 * @requires $timeout
 * @requires $sce
 *
 **/
xNgTable.factory('xNgTable', ['$http', 'ngTableParams', '$filter', '$timeout', '$sce', function ($http, ngTableParams, $filter, $timeout, $sce) {
    return function (table) {
        // These are the default settings, extended
        var factory = this;

        var tableSettings = $.extend(true, {
            global_filter: false, // turn on or off global filtering
            selectable: 'selected', // can you select rows in the table? - false:no, other uses the tick attribute
            class: "table-striped table-bordered table-hover",
            dropdown_actions: true,
            copy_text: true,
            selection_rule: function() {return true},

            default_filter: {},
            data: [], // default: no columns
            url: null, // if we want to fetch data from a url
            filter: 'inside',
            filter_data_backend: false,

            actions: [], // Normal action. also, if it is equal to false, no actions
            actions_list: [], // Calls a function

            addRow: false, // can you add a row?
            rowTitle: "", // for add row, etc..
            delete: false, // is this deleteable? if so, write the field name

            // row click
            row_click: null,
            row_click_ctrl: null,

            // row double click
            row_2click: null,
            row_2click_ctrl: null
        }, table);

        // Add the selectable row tick in the start of the columns
        if (tableSettings.selectable != false)
            tableSettings.data.unshift({
                title: '',
                field: tableSettings.selectable,
                disable_event: true,
                style: {width: '30px'}
            });
        // Add the delete row in the end of the columns
        if (tableSettings.delete != false)
            tableSettings.data.push({
                title: '',
                field: tableSettings.delete,
                disable_event: true,
                style: {'text-align': 'center'},
                dataType: "command"
            });

        // Eventually, the table variable will hold everything about the table
        factory.extended = {
            status: false, //render the table?
            table: null, //this is the table itself
            data: [], //this is the table's data
            tableSettings: tableSettings, // Have the user's settings, with the default ones
            private_events: {
                /**
                 * @ngdoc method
                 * @name fix_header
                 * @methodOf xNgTable#extended.private_events
                 * @description
                 * If you try to create a floating thead, this method will fix the header to be the correct sizes.
                 * @deprecated
                 * @returns {void} Nothing
                 */
                fix_header: function () { // fixes the header. should be launched after every data loading.
                    return; //disable fix header
                    var $table = $('table.myNgTable'),
                        $bodyCells = $table.find('tbody tr:first').children(),
                        colWidth;

                    // Adjust the width of thead cells when window resizes
                    $(window).resize(function () {
                        // Get the tbody columns width array
                        colWidth = $bodyCells.map(function () {
                            return $(this).width();
                        }).get();

                        // Set the width of thead columns
                        $table.find('thead tr').children().each(function (i, v) {
                            $(v).width(colWidth[i]);
                        });
                    }).resize(); // Trigger resize handler

                    $('table.myNgTable thead').css('display', 'block');
                },
                /**
                 * @ngdoc method
                 * @name filter_order_data
                 * @methodOf xNgTable#extended.private_events
                 * @description
                 * Handles offline filtering and ordering of data
                 * @returns {Array} Filtered Data
                 */
                filter_order_data: function (filter, order, callback) {
                    var filteredData = factory.extended.data;
                    $.each(filter, function (key, value) {
                        var obj = {};
                        obj[key] = value;
                        if (Array.isArray(value))
                            if (value.length > 0)
                                filteredData = $filter('in_Array')(filteredData, obj);
                            else filteredData = filteredData;
                        else if (value !== null && typeof value === 'object') {
                            //this is for dates
                        } else
                            filteredData = $filter('filter')(filteredData, obj)
                    });

                    //for some reason, I needed to get the order out of the object
                    if (order) {
                        var key = "";
                        $.each(order, function (k, v) {
                            key = k;
                        });
                        filteredData = $filter('orderBy')(filteredData, key, order[key] == 'desc');
                    }

                    factory.extended.status = true;

                    callback(filteredData);
                    return filteredData;
                },
                /**
                 * @ngdoc method
                 * @name filter_order_data_backend
                 * @methodOf xNgTable#extended.private_events
                 * @description
                 * Handles online filtering and ordering of data
                 * @returns {Array} If filters are the same as last time, does an offline filtering, if not, returns nothing.
                 */
                filter_order_data_backend: function (filter, order, callback) {
                    if (factory.extended.variables.force_backend_refresh != true && JSON.stringify(filter) == factory.extended.variables.last_filter
                        && JSON.stringify(order) == factory.extended.variables.last_order) {
                        return factory.extended.private_events.filter_order_data(filter, order, callback);
                    } else {
                        factory.extended.variables.force_backend_refresh = false;
                        factory.extended.variables.last_filter = JSON.stringify(filter);
                        factory.extended.variables.last_order = JSON.stringify(order);

                        $http.post(factory.extended.tableSettings.url, {
                            filter: filter,
                            order: order
                        }).success(function (response) {
                            if (response.status == true && response.data.length > 0) {
                                factory.extended.data = response.data;
                                factory.extended.variables.total_results = response.total_count;
                                factory.extended.status = true;
                                callback(factory.extended.data);
                            } else {
                                factory.extended.data = [];
                                factory.extended.variables.total_results = 0;
                                factory.extended.status = true;
                                callback([]);
                            }
                        }).error(function (data, status) {
                            factory.extended.data = [];
                            factory.extended.variables.total_results = 0;
                            factory.extended.status = false;
                            callback([]);
                        });
                    }
                }
            },
            events: { // These are the public table events
                /**
                 * @ngdoc method
                 * @name void
                 * @methodOf xNgTable#extended.events
                 * @description
                 * Does nothing
                 * @returns {void}
                 */
                void: function () {},
                /**
                 * @ngdoc method
                 * @name trust_as_html
                 * @methodOf xNgTable#extended.events
                 *
                 * @param {string} text
                 *
                 * @description
                 * Allows Angular to trust the text as HTML.
                 * @returns {string} HTML valid string
                 */
                trust_as_html: $sce.trustAsHtml,
                /**
                 * @ngdoc method
                 * @name get_selected_rows
                 * @methodOf xNgTable#extended.events
                 * @description
                 * Searches for the selected rows i the table.
                 * @returns {Array} Selected rows's indexes
                 */
                get_selected_rows: function () { //returns an array with indexes to the selected rows
                    var selected = [];
                    $.each(factory.extended.data, function (key, val) {
                        if (factory.extended.data[key][factory.extended.tableSettings.selectable] == true)
                            selected.push(key);
                    });
                    return selected;
                },
                /**
                 * @ngdoc method
                 * @name selectAll
                 * @methodOf xNgTable#extended.events
                 * @description
                 * Makes all rows to be selected
                 * @returns {void}
                 */
                selectAll: function () {
                    var selectable = factory.extended.tableSettings.selectable;
                    $.each(factory.extended.data, function (key, val) {
                        if(factory.extended.tableSettings.selection_rule(val))
                            val[selectable] = true;
                    });
                },
                /**
                 * @ngdoc method
                 * @name deselectAll
                 * @methodOf xNgTable#extended.events
                 * @description
                 * Makes all rows to be not selected
                 * @returns {void}
                 */
                deselectAll: function () {
                    var selectable = factory.extended.tableSettings.selectable;
                    $.each(factory.extended.data, function (key, val) {
                        val[selectable] = false;
                    });
                },
                /**
                 * @ngdoc method
                 * @name row_click
                 * @methodOf xNgTable#extended.events
                 * @description
                 * Handle row_click event, and row_click_ctrl. Selects a row if requested.
                 * @returns {void}
                 */
                row_click: function (event, row, index, column) {
                    //to copy data
                    if (factory.extended.tableSettings.copy_text)
                        factory.extended.variables.text_to_copy = row[column];

                    //other events
                    if (event.ctrlKey && factory.extended.tableSettings.row_click_ctrl != null)
                        factory.extended.tableSettings.row_click_ctrl(row);
                    else if (factory.extended.tableSettings.row_click != null)
                        factory.extended.tableSettings.row_click(row);

                    var selectable = factory.extended.tableSettings.selectable;
                    if (selectable != false) {
                        var old_status = row[selectable];

                        // if ctrl was not clicked, remove all selected
                        if (!event.ctrlKey)
                            $.each(factory.extended.data, function (key, val) {
                                factory.extended.data[key][selectable] = false;
                            });

                        row[selectable] = old_status ? (!old_status) : true; //true/false
                    }
                },
                /**
                 * @ngdoc method
                 * @name row_2click
                 * @methodOf xNgTable#extended.events
                 * @description
                 * Handle row_2click event, and row_2click_ctrl
                 * @returns {void}
                 */
                row_2click: function (event, row, index) {
                    if (event.ctrlKey && factory.extended.tableSettings.row_2click_ctrl != null)
                        factory.extended.tableSettings.row_2click_ctrl(row);
                    else if (factory.extended.tableSettings.row_2click != null)
                        factory.extended.tableSettings.row_2click(row);
                },
                /**
                 * @ngdoc method
                 * @name refresh_table
                 * @methodOf xNgTable#extended.events
                 * @description
                 * Refreshes the table, front and back end
                 * @returns {void}
                 */
                refresh_table: function() {
                    factory.extended.variables.force_backend_refresh = true;
                    createTableURL(factory.extended.tableSettings.url);
                }
            },
            actions: { //main actions that should go from table to table
                /**
                 * @ngdoc method
                 * @name export_selected_csv
                 * @methodOf xNgTable#extended.actions
                 * @description
                 * Export selected rows to a CSV file.
                 * Supported on Chrome & Firefox.
                 * @returns {void}
                 */
                export_selected_csv: function () {
                    //Get keys for selected rows
                    var selected = factory.extended.events.get_selected_rows();

                    //CSV encoding:
                    var csvContent = "data:text/csv;charset=utf-8,";

                    //Title row
                    $.each(factory.extended.tableSettings.data, function(key, val) {
                        if(val.title != "")
                            csvContent += val.title + ",";
                    });
                    csvContent += "\n";

                    //Content rows
                    $.each(selected, function (index, k) {
                        var row = factory.extended.data[k];
                        $.each(factory.extended.tableSettings.data, function(key, val) {
                            if(val.title != "") {
                                if (val.function === undefined)
                                    var d = row[val.field];
                                else
                                    var d = val.function(row);
                                csvContent += encodeURIComponent(new String(d).replace(',', '\,')).replace(/%20/g,' ') + ",";
                            }
                        });
                        csvContent += "\n";
                    });

                    //Using HTML5 download to download
                    var download = document.createElement("a");
                    download.setAttribute("download", "export.csv");
                    download.setAttribute("href", encodeURI(csvContent));
                    document.body.appendChild(download); //this is needed for firefox support
                    download.click();
                    document.body.removeChild(download);
                }
            },
            variables: { //if there need to be extra variables, they would come here
                globalSearchTerm: '',   // Default search term
                total_results: 0,       // Saves the total results amount
                ranges: {
                    'Today': [moment(), moment()],
                    'Yesterday': [moment().subtract('days', 1), moment().subtract('days', 1)],
                    'Last 7 days': [moment().subtract('days', 7), moment()],
                    'Last 30 days': [moment().subtract('days', 30), moment()],
                    'This month': [moment().startOf('month'), moment().endOf('month')]
                },
                text_to_copy: "",
                force_backend_refresh: true
            }
        };

        var createTableURL = function (url) {
            factory.extended.status = 'loading';
            $http.get(url).success(function (response) {
                factory.extended.status = true;
                if(Array.isArray(response)) //handling data out of format.
                    response = {
                        status: response.length != 0,
                        data: response
                    };

                if (response.status == true) {
                    createTable(response.data);
                } else {
                    createTable([]);
                    factory.extended.variables.total_results = 0;
                }
            }).error(function (data, status) {
                factory.extended.data = [];
                factory.extended.variables.total_results = 0;
                factory.extended.status = false;
                $defer.resolve([]);
            });
        };

        var createTable = function (data) {
            factory.extended.data = data;
            factory.extended.variables.total_results = data.length;

            // for customizing filters
            factory.extended.variables.available_filters = {};
            $.each(factory.extended.tableSettings.data, function (key, value) {
                if (value.filter !== undefined) {
                    //takes filters
                    $.each(value.filter, function (k, v) {
                        factory.extended.variables.available_filters[k] = v;
                    });
                }

            });
            factory.extended.table = new ngTableParams(
                {
                    count: 10,
                    filter: factory.extended.tableSettings.default_filter //use default filter
                }, {
                    counts: [], // Numberless
                    paginationMaxBlocks: 13,
                    paginationMinBlocks: 2,
                    defaultBaseUrl: "ng-table/filters/", // Base url for table filters
                    getData: function ($defer, params) {
                        //Start loading:
                        factory.extended.status = 'loading';

                        console.log(params);

                        //If there is a global parameter, add it to the filter list
                        if (factory.extended.tableSettings.global_filter && factory.extended.variables.globalSearchTerm != "")
                            if (params.filter())
                                var filter = $.extend(true, params.filter(), {$: factory.extended.variables.globalSearchTerm});
                            else
                                var filter = {$: factory.extended.variables.globalSearchTerm};
                        else
                            var filter = params.filter();

                        /* customize filter data */
                        $.each(filter, function (key, value) {
                            if (factory.extended.variables.available_filters[key] !== undefined) {
                                if ($.type(value) !== "object") {
                                    switch (factory.extended.variables.available_filters[key]) {
                                        case "dates_range":
                                            var explode = value.split(" - ");
                                            filter[key] = {"startDate": explode[0], "endDate": explode[1]};
                                            break;
                                    }
                                }
                            }
                        });

                        var callback = function(data) {
                            params.total(data.length);
                            $defer.resolve(data.slice((params.page() - 1) * params.count(), params.page() * params.count()));
                        };

                        if (factory.extended.tableSettings.url != null && factory.extended.tableSettings.filter_data_backend == true)
                            factory.extended.private_events.filter_order_data_backend(filter, params.sorting(), callback);
                        else
                            factory.extended.private_events.filter_order_data(filter, params.sorting(), callback);
                    }
                }
            );

            // An event to remove a row. No URL required
            factory.extended.events.remove_row = function (identifier, value) {
                factory.extended.data = $.grep(factory.extended.data, function (v) {
                    return v[identifier] != value;
                });
                factory.extended.variables.total_results = factory.extended.data.length;
            };

            // An event to remove a row. A URL is required. Also, a message selector for the server response
            factory.extended.events.delete = function (url, message_selector, identifier, value) {
                $http.get(url).success(function (response) {
                    if (response.status) {
                        // response that something happened
                        message(message_selector, "success", "Row was successfully deleted!");
                        factory.extended.events.remove_row(identifier, value);
                    } else // response that something happened
                        message(message_selector, "warning", "Unknown error occurred. Try again.");
                }).error(function () {
                    message(message_selector, "warning", "Unknown error occurred. Try again.");
                });
            };
            factory.extended.events.add_row = function (url, post, button, confirm, double, callback) {
                if (!confirm)
                    button_state("error", table.scope, button);
                else {
                    var valid = true;
                    $.each(factory.extended.data, function (index, value) {
                        var valid_double = false;
                        $.each(double, function (k, v) {
                            if (value[v] != post[v])
                                valid_double = true;
                        });
                        if (!valid_double)
                            valid = false;
                    });

                    if (!valid)
                        button_state("error", table.scope, button);
                    else {
                        $http.post(url, post).success(function (response) {
                            if (response.status) {
                                button_state("success", table.scope, button);
                                callback(response.data);
                            } else
                                button_state("error", table.scope, button);
                        }).error(function () {
                            button_state("error", table.scope, button);
                        });
                    }
                    if (!table.scope.$$phase) table.scope.$apply();
                }
            };
            table.scope.$watch(function () {
                return factory.extended.data
            }, function () {
                factory.extended.table.reload();
            }, true);
        };

        if (factory.extended.tableSettings.url != null && factory.extended.tableSettings.filter_data_backend == false)
            createTableURL(factory.extended.tableSettings.url);
        else createTable([]);


        //This is for the fixed header. It waits for the view to load, and then fixes the th.
        var waitForRenderAndDoSomething = function () {
            if ($http.pendingRequests.length > 0) {
                $timeout(waitForRenderAndDoSomething); // Wait for all templates to be loaded
            } else {
                factory.extended.private_events.fix_header();


                // Filters Dom
                $(".name-filter-by").click(function () {
                    var theFilter = $(this).closest(".div-filter-by").find(".body-filter-by"); // body filter by
                    if ($(theFilter).hasClass("hide"))
                        $(".body-filter-by").addClass("hide");
                    $(theFilter).toggleClass("hide")
                });
                factory.closeFilters = function () {
                    $(".body-filter-by").addClass("hide");
                };
            }
        };
        $timeout(waitForRenderAndDoSomething); // Waits for first digest cycle

        if (factory.extended.tableSettings.copy_text) {
            $(document).on('click', 'table.myNgTable td', function () {
                $('table.myNgTable td').removeClass('focus'); //Remove focus from other TDs
                $(this).addClass('focus');
            });

            $(document).on('keydown', function (e) {
                if (e.ctrlKey && e.which === 67) {
                    var text = "";
                    if (window.getSelection)
                        text = window.getSelection().toString();
                    else if (document.selection && document.selection.type != "Control")
                        text = document.selection.createRange().text;

                    if (text == '') {
                        var copyInput = $("#text_to_copy");
                        copyInput.val(factory.extended.variables.text_to_copy);
                        copyInput.select();
                        try {
                            var successful = document.execCommand('copy');
                            if (!successful)
                                alert("Could not copy! Try again");
                        } catch (err) {
                            alert("Could not copy! Your browser does not support it.");
                        }
                    }
                }
            });
        }
        return factory.extended;
    }
}]);
/**
 * @ngdoc filter
 * @name .in_Array
 * @function // all filters are a function
 *
 * @requires $filter
 *
 * @param {Array} data
 * @param {Object} filter
 *
 * @returns {Array} The filtered data array by the filter object
 *
 * @description
 * Filters an Array of objects by in which the object's filter.key is like %filter.val%
 *
 */
xNgTable.filter("in_Array", function ($filter) {
    return function (data, filter) {
        var out = [];
        $.each(filter, function (key, val) {
            var obj = {};
            for (var i = 0; i < val.length; i++) {
                obj[key] = val[i]; //make the object to search
                //unique the merged array of the data until now, and the new data
                out = $.unique($.merge(out, $filter('filter')(data, obj)));
            }
        });
        return out;
    };
});
/* Should be an object prototype, But I suck */
function Object2Array(obj) {
    var arr = [];
    $.each(obj, function (key, val) {
        arr.push(val);
    });
    return arr;
}
function Object2keysArray(obj) {
    var arr = [];
    $.each(obj, function (key, val) {
        arr.push(key);
    });
    return arr;
}
function restrictNumeric(e) {
    // Allow: backspace, delete, tab, escape, enter and .
    if ($.inArray(e.keyCode, [46, 8, 9, 27, 13, 110, 190]) !== -1 ||
            // Allow: Ctrl+A, Command+A
        (e.keyCode == 65 && ( e.ctrlKey === true || e.metaKey === true ) ) ||
            // Allow: home, end, left, right, down, up
        (e.keyCode >= 35 && e.keyCode <= 40)) {
        // let it happen, don't do anything
        return;
    }
    // Ensure that it is a number and stop the keypress
    if ((e.shiftKey || (e.keyCode < 48 || e.keyCode > 57)) && (e.keyCode < 96 || e.keyCode > 105)) {
        e.preventDefault();
    }
}