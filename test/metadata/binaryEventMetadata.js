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
            var events = [{
                eventId: EventStoreClient.Connection.createGuid(),
                eventType: "MetadataTestEvent",
                data: new Buffer("Testing reading and writing event metadata"),
                metadata: new Buffer(testRunDate)
            }];

            var connection = new EventStoreClient.Connection({ host: defaultHostName, onError: done });
            connection.writeEvents(streamId, EventStoreClient.ExpectedVersion.Any, false, events, credentials, function(completed) {
                testEventNumber = completed.firstEventNumber;
                connection.close();
                done();
            });            
        });
        it("should have metadata defined on the event", function(done) {
            var readEvent = null;

            readTestEvent(testEventNumber, createOptions(done), 
                function(event) { readEvent = event; },
                function (connection, completed) {
                    assert.equal(completed.result, EventStoreClient.ReadStreamResult.Success,
                        "Expected a result code of Success, not " + EventStoreClient.ReadStreamResult.getName(completed.result));

                    assert.ok(typeof readEvent.metadata !== "undefined", "Expected event to have metadata");

                    assert.ok(readEvent.metadata !== null, "Expected metadata fields to have been present on the event");

                    assert.equal(testRunDate, readEvent.metadata.toString(),
                        "Expected metadata field 'testRanAt' to match date " + testRunDate);

                    connection.close();
                    done();
                });
        });
    });
});

function readTestEvent(eventNumber, options, onEventAppeared, onCompleted) {
    var maxCount = 1;    
    var connection = new EventStoreClient.Connection(options);
    connection.readStreamEventsBackward(streamId, eventNumber, maxCount, false, false, onEventAppeared, credentials, function(completed) {
        onCompleted(connection, completed);
    });
}

function createOptions(done) {
    return {
        host: defaultHostName,
        onError: done
    };
}