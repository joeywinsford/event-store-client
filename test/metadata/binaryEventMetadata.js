var assert = require("assert");
var EventStoreClient = require("../../index.js");
var dbconn = require("../common/dbconn");

var defaultHostName = dbconn.defaultHostName;
var credentials = dbconn.credentials;

var streamId = "event-store-client-test";

describe("Binary Event Metadata", function() {
    describe("Reading binary metadata from an event", function() {

        var testEventNumber = null;
        var testRunDate = new Date().toISOString();
        
        before("Writing a test event with metadata", function(done) {

            var data = new Buffer("Testing reading and writing event metadata");
            var metadata = new Buffer(testRunDate);

            writeMetadataTestEvent(data, metadata, createOptions(done), function(connection, completed) {
                testEventNumber = getNewEventNumber(connection, completed, done);
            });
            
        });
        it("should have metadata defined on the event", function(done) {
            var readEvent = null;
            var maxCount = 1;
            var onEventAppeared = function (event) {
                readEvent = event;
            };

            var connection = new EventStoreClient.Connection(createOptions(done));
            connection.readStreamEventsBackward(streamId, testEventNumber, maxCount, false, false, onEventAppeared, credentials, onCompleted);

            function onCompleted(completed) {
                assert.equal(completed.result, EventStoreClient.ReadStreamResult.Success,
                    "Expected a result code of Success, not " + EventStoreClient.ReadStreamResult.getName(completed.result));

                assert.ok(typeof readEvent.metadata !== "undefined", "Expected event to have metadata");

                assert.ok(readEvent.metadata !== null, "Expected metadata fields to have been present on the event");

                assert.equal(testRunDate, readEvent.metadata.toString(),
                    "Expected metadata field 'testRanAt' to match date " + testRunDate);
                
                connection.close();
                done();
            };
        });
    });
});

function writeMetadataTestEvent(data, metadata, options, onCompleted) {
    var events = [{
        eventId: EventStoreClient.Connection.createGuid(),
        eventType: "MetadataTestEvent",
        data: data,
        metadata: metadata
    }];

    var connection = new EventStoreClient.Connection(options);
    connection.writeEvents(streamId, EventStoreClient.ExpectedVersion.Any, false, events, credentials, function(completed) {
        onCompleted(connection, completed);
    });
}

function createOptions(done) {
    return {
        host: defaultHostName,
        onError: done
    };
}

function getNewEventNumber(connection, completed, done) {
    connection.close();
    done();
    return completed.firstEventNumber;
};