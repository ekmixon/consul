import { moduleFor, test } from 'ember-qunit';
import repo from 'consul-ui/tests/helpers/repo';
import { env } from '../../../../env';

const NAME = 'kv';
moduleFor(`service:repository/${NAME}`, `Integration | Service | ${NAME}`, {
  // Specify the other units that are required for this test.
  integration: true,
});
const dc = 'dc-1';
const id = 'key-name';
const undefinedNspace = 'default';
const undefinedPartition = 'default';
const partition = 'default';
[undefinedNspace, 'team-1', undefined].forEach(nspace => {
  test(`findAllBySlug returns the correct data for list endpoint when nspace is ${nspace}`, function(assert) {
    return repo(
      'Kv',
      'findAllBySlug',
      this.subject(),
      function retrieveTest(stub) {
        return stub(
          `/v1/kv/${id}?keys&dc=${dc}${typeof nspace !== 'undefined' ? `&ns=${nspace}` : ``}${
            typeof partition !== 'undefined' ? `&partition=${partition}` : ``
          }`,
          {
            CONSUL_KV_COUNT: '1',
          }
        );
      },
      function performTest(service) {
        return service.findAllBySlug({
          id,
          dc,
          ns: nspace || undefinedNspace,
          partition: partition || undefinedPartition,
        });
      },
      function performAssertion(actual, expected) {
        const expectedNspace = env('CONSUL_NSPACES_ENABLED')
          ? nspace || undefinedNspace
          : 'default';
        const expectedPartition = env('CONSUL_PARTITIONS_ENABLED')
          ? partition || undefinedPartition
          : 'default';
        assert.deepEqual(
          actual,
          expected(function(payload) {
            return payload.map(item => {
              return {
                Datacenter: dc,
                Namespace: expectedNspace,
                Partition: expectedPartition,
                uid: `["${expectedPartition}","${expectedNspace}","${dc}","${item}"]`,
                Key: item,
              };
            });
          })
        );
      }
    );
  });
  test(`findBySlug returns the correct data for item endpoint when nspace is ${nspace}`, function(assert) {
    return repo(
      'Kv',
      'findBySlug',
      this.subject(),
      function(stub) {
        return stub(
          `/v1/kv/${id}?dc=${dc}${typeof nspace !== 'undefined' ? `&ns=${nspace}` : ``}${
            typeof partition !== 'undefined' ? `&partition=${partition}` : ``
          }`
        );
      },
      function(service) {
        return service.findBySlug({
          id,
          dc,
          ns: nspace || undefinedNspace,
          partition: partition || undefinedPartition,
        });
      },
      function(actual, expected) {
        assert.deepEqual(
          actual,
          expected(function(payload) {
            const item = payload[0];
            return Object.assign({}, item, {
              Datacenter: dc,
              Namespace: item.Namespace || undefinedNspace,
              Partition: item.Partition || undefinedPartition,
              uid: `["${item.Partition || undefinedPartition}","${item.Namespace ||
                undefinedNspace}","${dc}","${item.Key}"]`,
            });
          })
        );
      }
    );
  });
});
