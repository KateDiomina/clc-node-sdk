var Promise = require("bluebird");
var Sdk = require('./../lib/clc-sdk.js');
var _ = require('underscore');

var sdk = new Sdk();
var compute = sdk.computeServices();
var dataCenters = sdk.baseServices().dataCenters();

var DataCenter = compute.DataCenter;

var Group = compute.Group;

var allDataCenterExceptCa1 = function (dataCenterMetadata) {
    return dataCenterMetadata.id !== DataCenter.CA_VANCOUVER.id;
};

function clearAccount() {
    console.log('clear environment');

    return dataCenters
        .find({
            where: allDataCenterExceptCa1
        })
        .then(deleteServers)
        .then(deleteGroups)
        .then(clearDone);
}

function deleteServers(dataCenters) {
    console.log('delete all servers');
    return compute.servers().delete({
            group: {
                dataCenter: dataCenters,
                nameContains: [Group.ARCHIVE, Group.TEMPLATES, Group.DEFAULT]
            }
        })
        .catch(function() {
            return dataCenters;
        });
}

function deleteGroups(dataCenters) {
    console.log('delete all groups, except Archive, Default Group, Templates');

    return compute.groups().find(
            {
                dataCenter: dataCenters,
                name: [Group.DEFAULT, Group.ARCHIVE, Group.TEMPLATES]
            }
        ).then(function(groups) {
            var subGroups = _.chain(groups)
                    .map(function(group) {
                        return group.getGroups();
                    })
                    .flatten()
                    .value();

            if (subGroups.length > 0) {
                compute.groups().delete(subGroups);
            }
            return;
        });
}

function clearDone() {
    console.log('Finished!');
}

function run() {
    clearAccount();
}

run();