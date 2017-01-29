/*
 * Copyright 2017 Teppo Kurki <teppo.kurki@iki.fi>
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

const debug = require('debug')('signalk-ws-plugin-provider')
const SignalK = require('signalk-client')

module.exports = function(app) {
  var plugin = {}

  var selfHost = app.config.getExternalHostname() + ".";
  var selfPort = app.config.getExternalPort();
  var remoteServers = {};
  remoteServers[this.selfHost + ":" + this.selfPort] = {};

  var signalkClient

  function connect(discovery) {
    debug(discovery)
    if(remoteServers[discovery.host + ":" + discovery.port]) {
      debug("Discovered " + discovery.host + ":" + discovery.port + " already known, not connecting");
      return;
    }
    var signalkClient = new SignalK.Client();
    var url
    if(discovery.discoveryResponse) {
      _object.values(discovery.discoveryResponse.endpoints)[0]['signalk-ws'];
    } else {
      url = "ws://" + discovery.host + ":" + discovery.port + "/signalk/v1/stream?subscribe=all"
    }
    var onConnect = function(connection) {
      remoteServers[discovery.host + ":" + discovery.port] = {};
      debug("Connected to " + url);
    }
    var onDisconnect = function() {
      debug("Disconnected from " + url);
    }
    var onError = function(err) {
      debug("Error:" + err);
    }
    signalkClient.connectDeltaByUrl(
      url,
      msg => {
        if(msg.updates) {
          app.signalk.addDelta.call(app.signalk, msg)
        }
      },
      onConnect,
      onDisconnect,
      onError);
  }

  plugin.start = function(props) {
    debug("starting with props " + JSON.stringify(props))
    signalkClient = new SignalK.Client()
    if(props.useDiscovery) {
      signalkClient.on('discovery', connect)
      debug("Starting discovery")
      signalkClient.startDiscovery()
    }
    var hosts = props.hosts ||  []
    hosts.forEach(host => {
      debug("Connecting to " + host)
      var aClient = new SignalK.Client()
      signalkClient.connectDeltaByUrl(
        "ws://" + host + "/signalk/v1/stream?subscribe=all",
        (delta) => {
          if(delta.updates) {
            app.signalk.addDelta.call(app.signalk, delta)
          }
        },
        (connection) => {
          debug("Connected to " + host)
        },
        () => {
          debug("Disconnected from " + host)
        },
        (err) => {
          console.error(err)
        })
    })
    debug("started")
  };

  plugin.stop = function() {
    debug("stopping")
    debug("stopped")
  };

  plugin.id = "signalk-ws-provider"
  plugin.name = "Signal K WebSocket Provider"
  plugin.description = "Plugin that can connect to another Signal K server and pipe data from it"

  plugin.schema = {
    type: "object",
    properties: {
      useDiscovery: {
        type: "boolean",
        title: "Discover hosts",
        default: true
      },
      hosts: {
        title: "Configure hosts",
        type: "array",
        items: {
          type: "string",
          title: "Host",
          default: "host:port"
        }
      }
    }
  }

  return plugin;
}
