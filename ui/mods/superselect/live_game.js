(function() {

var MAX_SELECTIONS = 32;
var last_cycled = null;

var selection_stack = [];
var selection_index = 0;

var array_check_retained = function(e) {
    return e.status === 'retained';
};

Array.prototype.equals = function(a2) {
    var a1 = this;
    return _.every(_.map(ko.utils.compareArrays(a1, a2), array_check_retained));
};

var push_no_consecutive_dupes_or_empties = function (a, e) {
    if (!(e && e.length)) {
        return;
    }

    sorted = e.slice().sort();
    if (!(a.length && a[a.length-1].equals(sorted))) {
        return a.push(sorted);
    }
};

var get_current_selection = function() {
    return selection_stack[selection_index];
};

var get_previous_selection = function() {
    selection_index--;
    selection = [];
    if (selection_index >= 0) {
        selection = selection_stack[selection_index];
    }
    return selection;
};

var get_next_selection = function() {
    selection_index++;
    return selection_stack[selection_index];
};

var set_next_selection = function(selection) {
    selection_stack = selection_stack.slice(0, Math.max(0, selection_index+1));
    push_no_consecutive_dupes_or_empties(selection_stack, selection);
    while (selection_stack.length > MAX_SELECTIONS) {
        selection_stack.shift();
    }
    selection_index = selection_stack.length - 1;
};

var get_selected_unit_ids = function(selection_model) {
    var unit_ids = [];
    if (selection_model && selection_model.spec_ids) {
        return _.chain(selection_model.spec_ids).toArray().flatten()
                                                .value().slice().sort();
    }
    return unit_ids;
};


// Cycle Selection of One Unit
model.cycle_one_in_selection = function() {

    // You can't cycle if there is no superset selection, or a cycle selection
    if (model.selection()) {

        var superset = get_current_selection();
        var unit = null;

        // Find the next position in the cycle, and loop if at the end
        if (superset.length) {
            index = superset.indexOf(last_cycled);
            if (index < 0) {
                index = 0;
            } else {
                index = (index + 1) % superset.length;
            }
            unit = superset[index];
        }

        if (unit) {
            engine.call('select.byIds', [unit]);
            last_cycled = unit;
        }
    }
};


// Select Previous Selection
model.select_previous_selection = function() {
    var selection = get_selected_unit_ids(model.selection());
    var prev = [];

    if (last_cycled) {
        prev = get_current_selection() || [];
    } else {
        do {
            prev = get_previous_selection() || [];
        } while (selection.length && selection.equals(prev));
    }

    last_cycled = null;  // Clear the cycle-selection state
    engine.call('select.byIds', prev);
};

// Select Next Selection
model.select_next_selection = function() {
    var next = get_next_selection();
    last_cycled = null;  // Clear the cycle-selection state
    engine.call('select.byIds', next);
};


// Selection Subscriber
model.selection.subscribe(function (value) {
    // Only capture selection events that are completed
    if (value && value.selectionResult) {
        var selection = value.selectionResult;

        last_cycled = null;  // Clear the cycle-selection state

        if (selection) {
            set_next_selection(selection);
        }
    }
});

api.Panel.message('', 'inputmap.reload');

})();
