(function() {

var MAX_SELECTIONS = 32;
var last_cycled = [];

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
    if (!_.isEmpty(e)) {
        sorted = _.clone(e).sort();
        if (!(!_.isEmpty(a) && _.last(a).equals(sorted))) {
            return a.push(sorted);
        }
    }
};

var get_current_selection = function() {
    return selection_stack[selection_index];
};

var get_previous_selection = function() {
    selection_index = Math.max(0, selection_index-1);
    return selection_stack[selection_index];
};

var get_next_selection = function() {
    selection_index = Math.min(selection_stack.length-1, selection_index+1);
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

var get_selected_unit_ids = function(payload) {
    var unit_ids = [];
    if (payload && payload.spec_ids) {
        unit_ids = _.clone(_.chain(payload.spec_ids)
                          .toArray().flatten().value()).sort();
    }
    return unit_ids;
};


// Cycle Selection of One Unit
model.select_each_unit_in_selection = function() {

    // You can't cycle if there is no superset selection, or a cycle selection
    if (model.selection()) {

        var superset = get_current_selection();
        var unit = null;

        // Find the next position in the cycle, and loop if at the end
        if (!_.isEmpty(superset)) {
            index = superset.indexOf(_.first(last_cycled));
            if (index < 0) {
                index = 0;
            } else {
                index = (index + 1) % superset.length;
            }
            unit = superset[index];
        }

        if (unit) {
            engine.call('select.byIds', [unit]);
            last_cycled = [unit];
        }
    }
};


// Select Previous Selection
model.select_previous_selection = function() {
    var selection = [];

    if (!_.isEmpty(last_cycled)) {
        selection = get_current_selection() || [];
    } else {
        selection = get_previous_selection() || [];
    }

    last_cycled = [];  // Clear the cycle-selection state
    if (!_.isEmpty(selection)) {
        engine.call('select.byIds', selection);
    }
};

// Select Next Selection
model.select_next_selection = function() {
    var next = get_next_selection();
    last_cycled = [];  // Clear the cycle-selection state
    engine.call('select.byIds', next);
};


// Selection Subscriber
model.selection_subscriber = function(payload) {

    // Only capture selection events that are completed
    if (payload && model.mode() != 'select') {
        var unit_ids = get_selected_unit_ids(payload);

        if (unit_ids && !unit_ids.equals(last_cycled)) {
            set_next_selection(unit_ids);
        }
    }
};

model.selection.subscribe(model.selection_subscriber);

api.Panel.message('', 'inputmap.reload');

})();
