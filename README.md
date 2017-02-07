# ws-provider-plugin
[Signal K Node server plugin](https://github.com/SignalK/signalk-server-node/blob/master/SERVERPLUGINS.md) that can connect to other SK servers/gateways to pipe their data into this server. You can use the plugin to connect to another server or for example iKommunicate and pipe its data into this server for processing, for example for logging purposes.

Currently the `self` identity in the incoming data must match what is in the configuration file of this server for the data to be treated as `self` data. Maybe add a configurable option to map incoming data context to self?

Install by installing with npm in the node server's installation directory:
```
npm install signalk/ws-provider-plugin
```

![image](https://cloud.githubusercontent.com/assets/1049678/22710033/821b5990-ed84-11e6-858d-a5b74b2f6589.png)
