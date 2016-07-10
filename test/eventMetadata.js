var assert = require("assert");
var EventStoreClient = require("../index.js");
var dbconn = require("./common/dbconn");

var defaultHostName = dbconn.defaultHostName;
var credentials = dbconn.credentials;

describe.only('Event Metadata', function() {
    describe('Reading metadata from an event', function() {
        it('should have metadata defined', function(done) {
            var options = {
                host: defaultHostName,
                onError: done
            };

            var readEvent = null;

            var streamId = "event-store-client-test";
            var fromEventNumber = 0;
            var maxCount = 1;
            var resolveLinkTos = false;
            var requireMaster = false;
            var onEventAppeared = function (event) {
                readEvent = event;
            };

            var connection = new EventStoreClient.Connection(options);
            connection.readStreamEventsBackward(streamId, fromEventNumber, maxCount, resolveLinkTos, requireMaster, onEventAppeared, credentials, function (completed) {
                assert.equal(completed.result, EventStoreClient.ReadStreamResult.Success,
                    "Expected a result code of Success, not " + EventStoreClient.ReadStreamResult.getName(completed.result)
                );
                assert.ok(typeof readEvent.metadata !== "undefined", "Expected event to have metadata")

                connection.close();
                done();
            });
        });
    });
});