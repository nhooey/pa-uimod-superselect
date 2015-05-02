(function() {

var array_check_retained = function(e) {
    return e.status === 'retained';
};

Array.prototype.equals = function(a2) {
    var a1 = this;
    return _.every(_.map(ko.utils.compareArrays(a1, a2), array_check_retained));
};

var last_cycled = null;
var dummy = "dummy";

var selection_stack = [];

var push_no_consecutive_dupes_or_empties = function (a, e) {
    if (!(e && e.length)) {
        return;
    }

    console.log('--- selection_stack.push: attempting to push: ', e);
    console.log('--- selection_stack.push: (a.length, a)', a.length, a);

    if (!(a.length && a[a.length-1].equals(e))) {
        console.log('--- selection_stack.push: ^^^^^^^^^^^^ PUSH: ', e);
        sorted = e.slice().sort();
        return a.push(sorted);
    } else {
        console.log('--- selection_stack.push: %%% not PUSHing because duplicate: ', e);
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
    console.log('--- cycle_one_in_selection: +++++++++++++++++++++++++++++++++++++++++++');

    // You can't cycle if there is no superset selection, or a cycle selection
    if (model.selection()) {

        var superset = [];
        if (last_cycled) {
            // If we *have* been cycling, take the superset off the selection stack
            superset = selection_stack.pop();
            console.log('--- cycle_one_in_selection: POP @@@@@@@@@@: ', superset);
        } else {
            // If we haven't been cycling, take the current selection as the superset
            superset = get_selected_unit_ids(model.selection());
            console.log('--- cycle_one_in_selection: get_selected_unit_ids() $$$$$$$$$$$$$: ', superset);
        }

        console.log('--- cycle_one_in_selection: superset[' + superset.length + ']: ', superset);

        var unit = null;

        // Find the next position in the cycle, and loop if at the end
        if (superset.length) {
            console.log('--- cycle_one_in_selection: superset');
            index = superset.indexOf(last_cycled);
            console.log('--- cycle_one_in_selection: index found: [' + index + ']');
            if (index < 0) {
                console.log('--- cycle_one_in_selection: index resetting to zero');
                index = 0;
            } else {
                // Bump the index by 1 and modulus in case it's at the end
                index = (index + 1) % superset.length;
            }
            unit = superset[index];
            console.log('--- cycle_one_in_selection: unit found: [' + unit + ']');
        }

        if (unit) {
            engine.call('select.byIds', [unit]);

            // Put the superset back so the next cycle-selection can get it
            push_no_consecutive_dupes_or_empties(selection_stack, superset);

            console.log('--- cycle_one_in_selection: setting last_cycled to: ', unit);
            last_cycled = unit;
        }
    }
};


// Selection Previous Selection
model.select_previous_selection = input.doubleTap(function() {
    console.log('--- select_previous_selection: <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<');

    last_cycled = null;  // Clear the cycle-selection state

    var selection = get_selected_unit_ids(model.selection());
    var prev = [];

    do {
        console.log('--- select_previous_selection: (selection.length, selection)', selection.length, selection);
        prev = selection_stack.pop() || [];
        console.log('--- select_previous_selection: POP @@@@@@@@@@: ', prev);
    } while (selection.length && selection.equals(prev));

    console.log('--- select_previous_selection: (prev, selection): ', prev, selection);

    engine.call('select.byIds', prev);
}, function() {
    api.camera.track(true);
});


// Selection Subscriber
model.selection.subscribe(function (value) {
    // Only capture selection events that are completed
    if (value && value.selectionResult) {
        console.log('--- selection subscriber: ```````````````````````````````````````````: ', value);
        var selection = value.selectionResult;

        last_cycled = null;  // Clear the cycle-selection state

        if (selection) {
            console.log('--- selected [' + selection.length + ']: ', selection);

            push_no_consecutive_dupes_or_empties(selection_stack, selection);

            while (selection_stack.length > 10) {
                selection_stack.shift();
            }
        } else {
            console.log('--- no selection');
        }
    }
});

api.Panel.message('', 'inputmap.reload');

})();
