(function () {
'use strict';

var Core = window.Guacamoly.Core;

var vue = new Vue({
    el: '#application',
    data: {
        busy: true,
        error: null,
        thing: {},
        publicProfile: {}
    },

    methods: {
        giveAddFocus: function () {
            this.$els.addinput.focus();
        }
    }
});

function main() {
    var search = g_server.search.slice(1).split('&').map(function (item) { return item.split('='); }).reduce(function (o, k) { o[k[0]] = k[1]; return o; }, {});

    if (!search.userId) {
        vue.error = 'No userId provided';
        vue.busy = false;
        return;
    }

    if (!search.id) {
        vue.error = 'No id provided';
        vue.busy = false;
        return;
    }

    Core.users.publicProfile(search.userId, function (error, result) {
        if (error) console.error(error);

        vue.publicProfile = result;

        if (result.title) window.document.title = result.title;
        if (result.backgroundImageDataUrl) window.document.body.style.backgroundImage = 'url("' + result.backgroundImageDataUrl + '")';

        Core.things.getPublicThing(search.userId, search.id, function (error, result) {
            vue.busy = false;

            if (error) {
                console.log(error);
                vue.error = 'Not found';
                return;
            }

            vue.thing = result;

            window.Guacamoly.disableCheckboxes();
        });
    });
}

// Main
main();

})();
