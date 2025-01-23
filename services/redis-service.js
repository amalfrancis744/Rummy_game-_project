const { createClient } = require('redis');

const client = createClient({
    url: process.env.REDIS_URL,
    password: process.env.REDIS_PASSWORD,
});

client.connect().then(() => {
    console.log('Connected to Redis');
}).catch((err) => {
    console.log("Redis Error message---",err);
})

module.exports = prefix => {
    if (prefix) prefix += ':';
    prefix = `${process.env.NODE_ENV || 'local'}:${prefix}`;

    async function hSet(key, field, value) {
        key = key.startsWith(prefix) ? key : (prefix + key);
        // console.log("Key in hset----------->" , key , "field-->" , field , "value--->" , value)
        if (null === value || undefined === value) {
            return client.hDel(key, field);
        } else {
            // console.log("Enter into else hset function")
            return client.hSet(key, field, JSON.stringify(value));
        }
    }

    async function cardUpdate(key, field, value) {
        key = key.startsWith(prefix) ? key : (prefix + key);
        console.log("Key in hset----------->" , key , "field-->" , field , "value--->" , value)
 
        // console.log("Enter into else hset function")
        return client.hSet(key, field, value);
        
    }

    // async function scan(){
    //     const result = await client.SCAN
    // }

    async function set(key, value) {
        key = key.startsWith(prefix) ? key : (prefix + key);
        if (null === value || undefined === value) {
            return client.del(key);
        } else {
            return client.set(key, JSON.stringify(value));
        }
    }

    async function get(key) {
        key = key.startsWith(prefix) ? key : (prefix + key);
        const result = await client.get(key);
        if (null !== result && undefined !== result) {
            return JSON.parse(result);
        }
        return null;
    }

    async function hGet(key, field) {
        key = key.startsWith(prefix) ? key : (prefix + key);
        return client.hGet(key, field).then(e => e ? JSON.parse(e) : null);
    }

    async function hGetAll(key) {
        console.log("prefix i am calling", prefix);
        key = key.startsWith(prefix) ? key : (prefix + key);
        // console.log("Key in hgetall-------->" , key)
        let json = await client.hGetAll(key);
        // console.log("data in room", json);
        if (json && Object.keys(json).length) {
            json = JSON.parse(JSON.stringify(json));
            for (const _key in json) {
                json[_key] = JSON.parse(json[_key]);
            }
            return json;
        }
    }

    async function hDel(key) {
        key = key.startsWith(prefix) ? key : (prefix + key);
        return client.hGetAll(key).then(json =>{ 
            console.log("JSON--->" , json)
            client.hDel(key, Object.keys(json))});
    }

    async function deleteCollection(key) {
        try {
          key = key.startsWith(prefix) ? key : (prefix + key);
          
          // Fetch all fields and values from the hash
          const json = await client.hGetAll(key);
          console.log("JSON--->", json);
          
          // Delete all fields from the hash
          if (json) {
            await client.hDel(key, Object.keys(json));
          }
          
          // Delete the hash itself
          await client.del(key);
          
          console.log("Collection deleted successfully");
        } catch (error) {
          console.error("Error deleting collection", error);
          throw error;
        }
      }

    async function del(key) {
        key = key.startsWith(prefix) ? key : (prefix + key);
        return client.del(key);
    }

    async function keys(pattern) {
        pattern = pattern.startsWith(prefix) ? pattern : (prefix + pattern);
        return client.keys(pattern);
    }

    async function hKeys(pattern) {
        pattern = pattern.startsWith(prefix) ? pattern : (prefix + pattern);
        return client.hKeys(pattern);
    }

    async function hGetAllEach(pattern) {
        pattern = pattern.startsWith(prefix) ? pattern : (prefix + pattern);
        console.log("pattern", pattern)
        const _keys = await keys(pattern);
        
        const all = await Promise.all(_keys.map(e => {
            try {
                return hGetAll(e);
            } catch (error) {
                return null;
            }
        }));
        return all.filter(e => e);
    }

    async function getAll(pattern, force) {
        if (!force) {
            pattern = pattern.startsWith(prefix) ? pattern : (prefix + pattern);
        }
        const _keys = await keys(pattern);
        const all = await Promise.all(_keys.map(async key => {
            try {
                return {
                    key, value: await hGetAll(key)
                };
            } catch (error) {
                try {
                    return {
                        key, value: await get(key)
                    };
                } catch (error2) {
                    return null;
                }
            }
        }));
        return all.filter(e => e);
    }

    async function incr(key) {
        key = key.startsWith(prefix) ? key : (prefix + key);
        return client.incr(key);
    }

    async function decr(key) {
        key = key.startsWith(prefix) ? key : (prefix + key);
        return client.decr(key);
    }

    async function hIncrBy(key, field, value = 1) {
        key = key.startsWith(prefix) ? key : (prefix + key);
        return client.hIncrBy(key, field, value);
    }

    async function hDecrBy(key, field, value = 1) {
        return hIncrBy(key, field, -value);
    }

    return {
        hSet,
        set,
        get,
        hGet,
        getAll,
        hGetAll,
        cardUpdate,
        hDel,
        del,
        keys,
        hKeys,
        hGetAllEach,
        incr,
        deleteCollection,
        decr,
        hIncrBy,
        hDecrBy,
    };
};
