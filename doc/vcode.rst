==================
 FloBot: VM codes
==================

.. note::

    This all completely changed.  It's amazing what writing
    working code will do to your ideas :-)

Instructions
============

The virtual machine defines a whole bunch of opcodes which take a 
variable number of 'ports' as their inputs and outputs.  Instructions
can set multiple ports, but each port is set by a single instruction.

Instructions are defined by a 'opcodes.json' file exported from the
C code.  (At the moment this is just a static file, I'd like to make 
this a bit more clever to keep the JSON file in sync with the C)

Hardware Interface
------------------

Some instructions correspond to reads or writes of hardware.
Sensor instructions only have outputs, and actuator instructions only
have inputs.  There can be multiple ports per instruction, for example
a line sensor could have two output ports, and an RGB LED could have three
inputs ports.

These instructions are special in that they can occur only once each
within a program.  This is a bit odd, but simplifies the compilation
process a lot.

Components
----------

Other instructions represent logic operations on data, for example adding
two numbers or remembering state with a flip-flop.  No side effects are
allowed.  Many instances of these can be used.

In the longer run, I'd like to support:

* variadic components, like an N-way add.
* ganged components, like an N-bit latch.
* compound components (eg: subroutines)

Connecting Nodes
================

The UI allows the user to connect nodes.  Each input node may only be
connected to a single output node, but each output node may have multiple
input nodes.  Disconnected inputs are assumed to be '0'.

The UI removes cycles by keeping track of an 'order' per node.  Output-only
nodes have an order 1, and all other nodes have an order at least one more
than the maximum order of the nodes connected to their inputs.

Cycles are removed by culling or disallowing edges which would cause
them: this process needs some work still.

Ports numbers aren't assigned in any particularly strict order.
Instead, the UI tries to keep the port numbers stable so that live
changes to the bytecode will be minimally disruptive to robot 
behaviour.

Serializing Nodes
-----------------

Once all this is done, nodes can easily be iterated over in order
of 'order', and turned into binary-encoded data for execution.

Each instruction has an associated opcode byte, and knows
how many other bytes it will use up.  Most instructions just
take a number of port addresses.  There are up to 255 ports, with 
0 reserved as "no connection" output or "zero" input.

Port Values
-----------

At this point, port values are a signed, fixed-point 16 bit value,
with a divisor of 100.  This is probably a little too small.
Overflows and underflows need to be handled more cleverly, or else
move to using floats.

Hexadecimal Format
==================

Javascript's binary handling is even more deranged than C's string
handling, so code is uploaded to the robot as a string of hex
characters.  I'm tempted to change this to base64.

