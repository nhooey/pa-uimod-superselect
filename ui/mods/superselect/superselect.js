(function() {

var set = 'general';
var display_sub_group = 'General';
var kb = function(name, def) {
    action_sets[set][name] = function () {
        if (model[name]) {
            model[name].apply(this, arguments);
        }
    };
    api.settings.definitions.keyboard.settings[name] = {
        title: name.replace(/_/g, ' '),
        type: 'keybind',
        set: set,
        display_group: 'Super Select',
        display_sub_group: display_sub_group,
        default: def || ''
    };
};

set = 'gameplay';
display_sub_group = 'Selection Cycles';
kb('select_previous_selection');
kb('select_next_selection');
kb('select_each_unit_in_selection');

})();
