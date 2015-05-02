(function() {

    model.cycle_one_in_selection = input.doubleTap(function() {
        if (!model.selection()) return
        var unit = _.chain(model.selection().spec_ids)
            .toArray()
            .flatten()
            .sample()
            .value()
        if (!unit) return
        engine.call("select.byIds", [unit])
    }, function() {
        api.camera.track(true)
    })

    api.Panel.message('', 'inputmap.reload');

})()
