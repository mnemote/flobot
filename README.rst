========
 FloBot
========

A visual dataflow language for robots

* `Original Blog Post <http://nick.zoic.org/etc/flobot-graphical-dataflow-language-for-robots/>`_

Very much just started development!  I'm doing this in a kind of
document-driven-design kind of way, so here's some initial docs which
describe features which don't exist yet:

* `Programmers Guide <doc/guide.rst>`_
* `WiFi Configuration <doc/wifi.rst>`_
* `(Sketchy) Virtual Machine Spec <doc/vcode.rst>`_

FloBot is intended to run on an `ESP8266 <http://esp8266.com/>`_
(or similar) based platform like
`NodeMCU <http://nodemcu.com/>`_ (you can buy these on Ebay) or
`Ciril <https://github.com/mnemote/ciril/>`_ (my other project,
still vapourware). Each platform would
include a hardware description file which describes the available
ports and functions.

.. raw:: html

    <iframe src="www/index.html" width="100%" height="420px" frameborder="1"></iframe>
