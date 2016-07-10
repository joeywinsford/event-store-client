var assert = require("assert");
var EventStoreClient = require("../index.js");
var dbconn = require("./common/dbconn");

var defaultHostName = dbconn.defaultHostName;
var credentials = dbconn.credentials;

describe.only("Event Metadata", function() {

    var testEventNumber = null;
    before("Writing a test event with metadata", function(done) {
        var options = {
                host: defaultHostName,
                onError: done
            };

            var streamId = "event-store-client-test";
            var expectedVersion = EventStoreClient.ExpectedVersion.Any;
            var requireMaster = false;
            var events = [{
                eventId: EventStoreClient.Connection.createGuid(),
                eventType: "MetadataTestEvent",
                data: {
                    comment: "Testing reading and writing event metadata"
                },
                metadata: {
                    testRanAt: new Date().toISOString()
                }
            }];

            var connection = new EventStoreClient.Connection(options);
            connection.writeEvents(streamId, expectedVersion, requireMaster, events, credentials, function (completed) {
                assert.equal(completed.result, EventStoreClient.OperationResult.Success,
                    "Expected a result code of Success, not " + EventStoreClient.OperationResult.getName(completed.result) + ": " + completed.message
                );

                testEventNumber = completed.firstEventNumber;

                connection.close();
                done();
            });
    });
    describe("Reading metadata from an event", function() {
        it("should have metadata defined on the event", function(done) {
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
            connection.readStreamEventsBackward(streamId, fromEventNumber, maxCount, resolveLinkTos, requireMaster, onEventAppeared, credentials, 
                function (completed) {
                    assert.equal(completed.result, EventStoreClient.ReadStreamResult.Success,
                        "Expected a result code of Success, not " + EventStoreClient.ReadStreamResult.getName(completed.result));
                    assert.ok(typeof readEvent.metadata !== "undefined", "Expected event to have metadata");

                    connection.close();
                    done();
                });
        });
    });
});