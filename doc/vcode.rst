==================
 FloBot: VM codes
==================

Hardware Interface
==================

Programs start with a number of nodes defined: some inputs and some 
outputs.  So our line follower might have inputs for line left and
line right, and outputs for motor left and motor right.  These
pre-existing nodes can't be deleted or created, they just are.

Nodes are ordered so that connections from output to input are always
from a lower numbered node to a higher one.  This eliminates the
possibility of cycles and means that a single pass through all nodes
is sufficient to recalculate everything.  Later, as an optimization, 
running only some branches could be considered.

Inserting Nodes
---------------

When a node is added to the program, it can just be inserte anywhere
on the list.  If it isn't connected to anything, its position doesn't
matter. 

To keep nodes in order, every time an edge is added the nodes are
rearranged to maintain this property.  If the user attempts to create
a cycle, older links are broken to prevent this.  

Serializing Nodes
-----------------

Once all this is done, nodes can easily be iterated over and turned into
binary-encoded data for execution.

.. note::

  This VM is very sketchy and only intended to be a very early 
  go at it, so I don't get all hung up on the details and never get
  around to working on the other parts.  It will change a lot.

  Important features are missing:

  * Instructions can only have two inputs: an IF(,,) needs three!
  * Instructions can only have one output: a flip-flop would be better
    with two
  * Instructions have no hidden state: I'd like to support
    "differentiate" and "integrate" and "limit rate of change"
    instructions to make it simple to get nice kinematics
  * The encoding is really quite inefficient.

  I'm wondering if I should just implement a Forth and get it over with :-)

  But here's what's here for now:

Ports
=====

* Programs have up to PORT_MAX (4096) ports.

* Each port has a value which is a signed 16-bit int, which is
  interpreted as a fixed-point number with divisor 100.

  * 0x0000 represents   0.00
  * 0x0064 represents   1.00
  * 0x1234 represents  46.60
  * 0xd0d0 represents -120.80

* The first N_input ports are input ports, and have no instruction
  associated with them.

* The remaining N_codes ports are the outputs of instructions ...

* Including the last N_output ports, which are the outputs


Instructions
============

* There are no instructions corresponding to input ports.
* Each instruction has an opcode and up to 2 ports as inputs.
* Each instruction is associated with an output port.
* When the instruction runs it reads the inputs and updates the output.
* Instructions may only read from ports lower than their output port.
* Input port number PORT_MAX is reserved as "NO PORT".


Binary Format
=============

When uploading code to the robot:

* Each instruction is packed into an unsigned 32-bit big-endian word.
* Highest 8 bits are the opcode.
* Constants are represented as the opcode "NOP" and the remaining 24
  bits are the constant
* Other opcodes have up to two port numbers of 12 bits each.

This is a reasonably compact and portable format which avoids too 
much buffering around.


Hexadecimal Format
==================

Javascript's binary handling is even more deranged than C's string
handling, so code can also be represented as groups of 8 hex digits
separated by a single whitespace.  I'm not totally happy with this,
but we'll see how it goes.


