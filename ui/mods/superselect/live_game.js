(function() {

var last_cycled = null;
var selection_stack = [];

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

    if (!(a.length && a[a.length-1].equals(e))) {
        sorted = e.slice().sort();
        return a.push(sorted);
    }
};

var get_selected_unit_ids = function(selection_model) {
    var unit_ids = [];
    if (selection_model && selection_model.spec_ids) {
        return _.chain(selection_model.spec_ids).toArray().flatten().value();
    }
    return unit_ids;
};


// Cycle Selection of One Unit
model.cycle_one_in_selection = function() {

    // You can't cycle if there is no superset selection, or a cycle selection
    if (model.selection()) {

        var superset = [];
        if (last_cycled) {
            // If we *have* been cycling, take the superset off the selection stack
            superset = selection_stack.pop();
        } else {
            // If we haven't been cycling, take the current selection as the superset
            superset = get_selected_unit_ids(model.selection());
        }

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

            // Put the superset back so the next cycle-selection can get it
            push_no_consecutive_dupes_or_empties(selection_stack, superset);

            last_cycled = unit;
        }
    }
};


// Selection Previous Selection
model.select_previous_selection = function() {
    last_cycled = null;  // Clear the cycle-selection state

    var selection = get_selected_unit_ids(model.selection());
    var prev = [];

    do {
        prev = selection_stack.pop() || [];
    } while (selection.length && selection.equals(prev));

    engine.call('select.byIds', prev);
};


// Selection Subscriber
model.selection.subscribe(function (value) {
    // Only capture selection events that are completed
    if (value && value.selectionResult) {
        var selection = value.selectionResult;

        last_cycled = null;  // Clear the cycle-selection state

        if (selection) {
            push_no_consecutive_dupes_or_empties(selection_stack, selection);

            while (selection_stack.length > 10) {
                selection_stack.shift();
            }
        }
    }
});

api.Panel.message('', 'inputmap.reload');

})();
