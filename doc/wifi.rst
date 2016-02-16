==============
 Flobot setup
==============

**OK, so this is my Documentation Driven Design approach here,
write the help file before the software ...**


Connecting to WiFi
==================

When the Flobot board boots, it needs to connect to an AP.
The best option here is push-button WPS.

*If that's not possible, perhaps we can configure settings
over the USB serial, or we can use the whole AP + Station
config option to present a configuration form.*


Finding the device
==================

Once the Flobot has connected and got itself a DHCPed address,
it needs to be easily accessible.  It sends a message to an 
central server which records the serial number of the device
and the (most likely local) address it can be reached on.  The
device can have a QR code sticker on it which points to the
central server and contains the device serial.

Jumping to that URL then redirects to the device itself.
The page is on the device but it can load the scripts from 
a CDN and communicate with the device's upload API 
without breaking CORS rules.

*Odds are the local address is on a localnet and if the device
you're trying to talk to it with is on some other network then
that's going to be messy.  So as an alternative, the device
could keep a tunnel open and communicate through it via the
central server.  But this is a bit awful too.*


Saving files
============

The Flobot "code" as such is a big fat JSONish structure, but
it can still be saved either onto the browsing device's
localStorage or to a repo via the Git HTTP API.  Or that
central server could include a load/save API as well.






