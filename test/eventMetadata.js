var assert = require("assert");
var EventStoreClient = require("../index.js");
var dbconn = require("./common/dbconn");

var defaultHostName = dbconn.defaultHostName;
var credentials = dbconn.credentials;

var streamId = "event-store-client-test";

describe.only("Event Metadata", function() {

    var testEventNumber = null;
    var testRunDate = new Date().toISOString();

    before("Writing a test event with metadata", function(done) {

        var events = [{
            eventId: EventStoreClient.Connection.createGuid(),
            eventType: "MetadataTestEvent",
            data: {
                comment: "Testing reading and writing event metadata"
            },
            metadata: {
                testRanAt: testRunDate
            }
        }];

        var connection = new EventStoreClient.Connection(createOptions(done));
        connection.writeEvents(streamId, EventStoreClient.ExpectedVersion.Any, false, events, credentials, onCompleted);

        function onCompleted(completed) {
            assert.equal(completed.result, EventStoreClient.OperationResult.Success,
                "Expected a result code of Success, not " + EventStoreClient.OperationResult.getName(completed.result) + ": " + completed.message);

            testEventNumber = completed.firstEventNumber;

            connection.close();
            done();
        };
    });
    describe("Reading metadata from an event", function() {
        it("should have metadata defined on the event", function(done) {

            var readEvent = null;

            var fromEventNumber = 0;
            var maxCount = 1;
            var onEventAppeared = function (event) {
                readEvent = event;
            };

            var connection = new EventStoreClient.Connection(createOptions(done));
            connection.readStreamEventsBackward(streamId, fromEventNumber, maxCount, false, false, onEventAppeared, credentials, onCompleted);

            function onCompleted(completed) {
                assert.equal(completed.result, EventStoreClient.ReadStreamResult.Success,
                    "Expected a result code of Success, not " + EventStoreClient.ReadStreamResult.getName(completed.result));

                assert.ok(typeof readEvent.metadata !== "undefined", "Expected event to have metadata");

                assert.ok(readEvent.metadata !== null, "Expected metadata fields to have been present on the event");
                connection.close();
                done();
            };
        });
    });
});

function createOptions(done) {
    return {
        host: defaultHostName,
        onError: done
    };
}