export default {
 "1.1.1": {
  "title": "The observational unit: what one row represents",
  "kicker": "1.1.1 · THE OBSERVATIONAL UNIT",
  "texts": [
   "One row = one order",
   "Count rows = count units",
   "Rows are not always people"
  ],
  "sentences": [
   "Welcome to the very first lesson of this course. We will go one step at a time.",
   "Data science is about learning useful things from notes about what really happened.",
   "Our first notes come from a small café.",
   "The owner wants to know: how many customers came between eight and nine this morning?",
   "To find out, she opens her notebook. She writes one short note for every order.",
   "Here are her notes from that hour.",
   "The first note is about a small coffee, at eight oh five.",
   "The second is about a medium tea, at eight eleven.",
   "Four more notes follow, until eight fifty-two. That makes six notes in all.",
   "These notes are data. Data means facts that were written down, to look at later.",
   "Now she copies the notes into a table: a grid of small boxes.",
   "Each note becomes one line going across. A line going across is called a row.",
   "Above the boxes, a heading says what each box holds, such as time, drink or price.",
   "To answer the owner, we first need to know: what does one row describe?",
   "Let's follow the first row, from left to right, one box at a time.",
   "The label: number one. It only numbers the notes, like a ticket number.",
   "Time of the order: eight oh five.",
   "Drink: coffee. Size: small.",
   "Price: three dollars.",
   "Waiting time: one hundred and twenty seconds, from ordering until the drink was ready.",
   "Takeaway: yes. The customer took the drink away.",
   "Apart from the label, every fact here is about the same thing: this one order.",
   "So the first row is one order.",
   "The second row is the tea at eight eleven. That is another order.",
   "Every row works the same way. One note, one order, one row.",
   "The thing that each row describes has a name. It is called the observational unit.",
   "Observational means looked at and written down. Unit means one single thing.",
   "Here, the observational unit is one order.",
   "Now, back to the owner's question. How many customers came?",
   "Let's count the rows: one, two, three, four, five, six.",
   "Six rows, so six orders. But is that six customers?",
   "Not for sure. Imagine one customer bought a coffee, then came back later for a tea.",
   "That is one person, but two rows, because each order gets its own row.",
   "And look at the headings: there is no name. The table does not say who ordered.",
   "So six orders could mean six people, or fewer. This table alone cannot tell us.",
   "A guest list would be different. There, one row is one person.",
   "So in a guest list, counting rows counts people.",
   "That is what the unit is for. It tells you what you are counting.",
   "It also tells you what a total means. Adding up the prices gives the money from six orders.",
   "So before you count or add anything, first ask: what is one row?",
   "In the next lesson, we will look down the table, at one heading at a time.",
   "To sum up: the observational unit is what one row describes. Here, one row is one order."
  ],
  "timing": [
   [
    0.8,
    5.31
   ],
   [
    5.76,
    10.03
   ],
   [
    10.48,
    12.53
   ],
   [
    12.98,
    17.51
   ],
   [
    17.96,
    23.26
   ],
   [
    23.71,
    24.9
   ],
   [
    25.35,
    28.78
   ],
   [
    29.23,
    32.2
   ],
   [
    32.65,
    37.24
   ],
   [
    37.69,
    42.35
   ],
   [
    42.8,
    46.98
   ],
   [
    47.43,
    52.49
   ],
   [
    52.94,
    58.85
   ],
   [
    59.3,
    63.06
   ],
   [
    63.51,
    67.23
   ],
   [
    67.68,
    72.04
   ],
   [
    72.49,
    74.89
   ],
   [
    75.34,
    77.43
   ],
   [
    77.88,
    79.46
   ],
   [
    79.91,
    84.72
   ],
   [
    85.17,
    88.59
   ],
   [
    89.04,
    93.98
   ],
   [
    94.43,
    96.36
   ],
   [
    96.81,
    100.77
   ],
   [
    101.22,
    105.44
   ],
   [
    105.89,
    110.34
   ],
   [
    110.79,
    115.69
   ],
   [
    116.14,
    119.14
   ],
   [
    119.59,
    123.1
   ],
   [
    123.55,
    127.67
   ],
   [
    128.12,
    131.55
   ],
   [
    132.0,
    137.22
   ],
   [
    137.67,
    141.9
   ],
   [
    142.35,
    146.71
   ],
   [
    147.16,
    152.61
   ],
   [
    153.06,
    157.07
   ],
   [
    157.52,
    160.46
   ],
   [
    160.91,
    163.83
   ],
   [
    164.28,
    169.43
   ],
   [
    169.88,
    174.17
   ],
   [
    174.62,
    178.66
   ],
   [
    179.11,
    185.38
   ]
  ],
  "T": 186.78,
  "video": "../ds-course-u01/video/1.1.1",
  "sim": true
 },
 "1.1.2": {
  "title": "Variables: one question, asked of every order",
  "kicker": "1.1.2 · VARIABLES",
  "texts": [
   "Variable = one thing noted for every row",
   "Its values fill one column",
   "Add down a column, never across"
  ],
  "sentences": [
   "Here is a table from a small café: a grid of rows and columns.",
   "It lists six orders from one morning. Each row, going across, is one order.",
   "The owner asks you: which order had the longest wait time, and which the shortest?",
   "One row shows the wait of only one order. You need all six waits together.",
   "They sit in a column: a line of boxes running from top to bottom.",
   "The name at the top is the heading. This one says \"wait time\": how long each customer waited.",
   "Let's read the column from the top, one order at a time.",
   "Order one waited one hundred and twenty seconds.",
   "Order two, ninety seconds.",
   "Order three, one hundred and fifty seconds.",
   "Order four, sixty seconds.",
   "Order five, one hundred and eighty seconds.",
   "Order six, sixty seconds again.",
   "It is like asking every customer the same question: how long did you wait?",
   "The column keeps their six answers, one below the other.",
   "The answers differ from order to order. Only the two sixties are the same.",
   "A column like this is called a variable.",
   "A variable is one thing you write down about every order.",
   "The name says it: its answers vary, which means they differ from order to order.",
   "Each single answer, like ninety seconds, is called a value.",
   "Here, value just means one answer. It has nothing to do with money.",
   "So the wait time variable has six values, one for each order.",
   "Now let's answer the owner, using only this variable.",
   "Run your eye down the wait time column, looking for the biggest number.",
   "The longest wait is one hundred and eighty seconds. That was order five.",
   "The shortest wait is sixty seconds. Orders four and six both have it.",
   "You did not need any other column.",
   "That is what a variable is for. It gathers one fact about every order, ready to compare.",
   "The other columns work the same way.",
   "The drink column notes what each customer chose. Its answers are words: coffee, tea or juice.",
   "The price column notes what each customer paid. Its answers are dollar amounts: three, four or five.",
   "So drink and price are variables too.",
   "The first column, the order number, is only a name tag. We use it to point to an order, not to compare.",
   "Here is a trap. Look across the row of order one.",
   "It shows two numbers side by side: three dollars and one hundred and twenty seconds.",
   "It is tempting to add them. That gives one hundred and twenty-three. But one hundred and twenty-three what?",
   "Dollars and seconds are different things. Adding them across a row means nothing.",
   "Adding down one column can make sense: waits with waits, dollars with dollars.",
   "The next lesson shows which columns you can add, and which you cannot.",
   "In short: a variable is one thing noted for every row. Its values fill one column, ready to compare."
  ],
  "timing": [
   [
    0.8,
    5.53
   ],
   [
    5.98,
    10.87
   ],
   [
    11.32,
    16.37
   ],
   [
    16.82,
    21.41
   ],
   [
    21.86,
    25.45
   ],
   [
    25.9,
    31.28
   ],
   [
    31.73,
    34.3
   ],
   [
    34.75,
    37.48
   ],
   [
    37.93,
    39.87
   ],
   [
    40.32,
    42.67
   ],
   [
    43.12,
    45.12
   ],
   [
    45.57,
    47.86
   ],
   [
    48.31,
    50.56
   ],
   [
    51.01,
    55.22
   ],
   [
    55.67,
    58.97
   ],
   [
    59.42,
    63.38
   ],
   [
    63.83,
    65.96
   ],
   [
    66.41,
    69.73
   ],
   [
    70.18,
    75.09
   ],
   [
    75.54,
    79.4
   ],
   [
    79.85,
    83.61
   ],
   [
    84.06,
    87.82
   ],
   [
    88.27,
    91.42
   ],
   [
    91.87,
    95.4
   ],
   [
    95.85,
    99.94
   ],
   [
    100.39,
    105.07
   ],
   [
    105.52,
    107.46
   ],
   [
    107.91,
    113.24
   ],
   [
    113.69,
    115.45
   ],
   [
    115.9,
    122.33
   ],
   [
    122.78,
    128.61
   ],
   [
    129.06,
    131.35
   ],
   [
    131.8,
    138.1
   ],
   [
    138.55,
    141.13
   ],
   [
    141.58,
    146.22
   ],
   [
    146.67,
    151.4
   ],
   [
    151.85,
    156.51
   ],
   [
    156.96,
    162.16
   ],
   [
    162.61,
    166.14
   ],
   [
    166.59,
    173.74
   ]
  ],
  "T": 175.14,
  "video": "../ds-course-u01/video/1.1.2",
  "sim": true
 },
 "1.1.3": {
  "title": "Categorical or numerical? Names you count, amounts you add",
  "kicker": "1.1.3 · CATEGORICAL OR NUMERICAL",
  "texts": [
   "Categorical = names for groups: count them",
   "Numerical = amounts: add and subtract",
   "Numbers are not always amounts (order no.)"
  ],
  "sentences": [
   "Imagine you run a small café.",
   "Every time someone orders, you write it down in a notebook.",
   "Here is one morning, between eight and nine o'clock: six orders.",
   "When the hour ends, you have two questions.",
   "First: how much money did we take?",
   "Second: which drink sells best?",
   "Each row of the notebook is one order.",
   "Each column records one thing about every order.",
   "Each single entry, like \"tea\" or \"four dollars\", is called a value.",
   "Let's see which columns can answer your questions.",
   "Start with the price column. The prices, in dollars, are three, four, five, four, four and three.",
   "Three plus four plus five makes twelve.",
   "Then four more makes sixteen, four more makes twenty, and three more makes twenty-three.",
   "Twenty-three dollars: that answers the first question. This total means something.",
   "The wait column shows how many seconds each customer waited.",
   "The longest wait is one hundred and eighty seconds. The shortest is sixty.",
   "One hundred and eighty minus sixty leaves one hundred and twenty.",
   "So the slowest customer waited one hundred and twenty seconds longer than the quickest. That gap means something too.",
   "Now the drink column, for the second question.",
   "What is coffee plus tea? There is no answer.",
   "These values are names, not amounts. You cannot add names, but you can count them.",
   "Counting tells you how many orders fall in each group.",
   "Three coffees, two teas, and one juice. Coffee sells best: that answers the second question.",
   "So the columns come in two kinds: names and amounts.",
   "Each drink is a name. It puts the order into a group: coffee, tea or juice.",
   "A group like this is called a category.",
   "A column like this, whose values change from order to order, is called a variable.",
   "So a column of names is called a categorical variable.",
   "In the price and wait columns, each value measures an amount: how many dollars, how many seconds.",
   "A column of amounts is called a numerical variable.",
   "Three more columns are left: takeaway, size, and the order number.",
   "Takeaway says if the customer took the drink away: yes or no.",
   "Like the drinks, yes and no are names for two groups. So takeaway is categorical.",
   "Size is small, medium or large: two small, three medium, one large.",
   "Small plus large means nothing. These are names for groups, so size is categorical.",
   "Sizes do go from small to large, but you cannot say how much bigger large is.",
   "For now, treat sizes as groups. The next lesson looks closer.",
   "Now a trap: the order number. This column is full of numbers, one to six.",
   "Add them up: one plus two plus three, all the way to six, makes twenty-one.",
   "Twenty-one what? It means nothing.",
   "These numbers are only name tags, like the ticket number you get at a counter.",
   "A bigger ticket number only means a later turn. It is not more coffee, or more money.",
   "Numbers are not always amounts.",
   "Here is a good test for any column.",
   "Ask: does each value measure how much of something there is?",
   "If yes, the variable is numerical. Here, adding and subtracting make sense.",
   "If the value only names a group, the variable is categorical. You count each group.",
   "Price: yes, it measures dollars. Order number: no, it is a name tag.",
   "Why does this matter? The kind of column tells you what you can work out.",
   "The money question needed a total, so it used a numerical column.",
   "The best-drink question needed counts, so it used a categorical column.",
   "In short: ask whether a column holds names or amounts. Names you count; amounts you add."
  ],
  "timing": [
   [
    0.8,
    2.44
   ],
   [
    2.89,
    6.0
   ],
   [
    6.45,
    10.85
   ],
   [
    11.3,
    13.71
   ],
   [
    14.16,
    16.19
   ],
   [
    16.64,
    18.86
   ],
   [
    19.31,
    21.27
   ],
   [
    21.72,
    25.01
   ],
   [
    25.46,
    29.71
   ],
   [
    30.16,
    32.3
   ],
   [
    32.75,
    39.59
   ],
   [
    40.04,
    42.64
   ],
   [
    43.09,
    48.74
   ],
   [
    49.19,
    53.76
   ],
   [
    54.21,
    57.73
   ],
   [
    58.18,
    62.88
   ],
   [
    63.33,
    66.74
   ],
   [
    67.19,
    73.29
   ],
   [
    73.74,
    76.1
   ],
   [
    76.55,
    79.11
   ],
   [
    79.56,
    84.38
   ],
   [
    84.83,
    88.08
   ],
   [
    88.53,
    95.15
   ],
   [
    95.6,
    99.11
   ],
   [
    99.56,
    104.93
   ],
   [
    105.38,
    107.39
   ],
   [
    107.84,
    112.73
   ],
   [
    113.18,
    116.54
   ],
   [
    116.99,
    123.32
   ],
   [
    123.77,
    126.73
   ],
   [
    127.18,
    131.46
   ],
   [
    131.91,
    135.55
   ],
   [
    136.0,
    141.69
   ],
   [
    142.14,
    147.71
   ],
   [
    148.16,
    153.38
   ],
   [
    153.83,
    158.78
   ],
   [
    159.23,
    163.49
   ],
   [
    163.94,
    169.01
   ],
   [
    169.46,
    174.85
   ],
   [
    175.3,
    177.29
   ],
   [
    177.74,
    181.43
   ],
   [
    181.88,
    186.87
   ],
   [
    187.32,
    189.07
   ],
   [
    189.52,
    191.2
   ],
   [
    191.65,
    195.12
   ],
   [
    195.57,
    200.95
   ],
   [
    201.4,
    206.91
   ],
   [
    207.36,
    212.58
   ],
   [
    213.03,
    216.12
   ],
   [
    216.57,
    219.99
   ],
   [
    220.44,
    224.44
   ],
   [
    224.89,
    231.09
   ]
  ],
  "T": 232.5,
  "video": "../ds-course-u01/video/1.1.3",
  "sim": true
 },
 "1.1.4": {
  "title": "Measurement scales: which comparisons make sense",
  "kicker": "1.1.4 · MEASUREMENT SCALES",
  "texts": [
   "Names, order, gaps, true zero",
   "Size: ordinal; price: ratio",
   "A number label keeps its scale"
  ],
  "sentences": [
   "Here is our café notebook again. Each row is one order. Each column records one thing about the orders.",
   "The owner looks at it and wonders: is a large drink twice as big as a small one?",
   "To answer, we will ask each column four kinds of question, from easy to hard.",
   "Let's start with the drink column: coffee, tea, coffee, juice, coffee, tea.",
   "Row one is a coffee. Row two is a tea. We can say they are different.",
   "But is tea more than coffee? Drinks have no order of their own, the way sizes go from small to large.",
   "Putting things in order, from least to most, is called ranking. Drinks cannot be ranked.",
   "We can still count them: three coffees, two teas, one juice. But counting is not ranking.",
   "So between two drinks, there is only one question: same, or different?",
   "Now the size column: small, medium, large, medium, medium, small.",
   "Sizes can be ranked: small, then medium, then large.",
   "So sizes allow a second question: which is more?",
   "Row three, a large, is more than row one, a small.",
   "But how much more? The size column does not say.",
   "Is the gap from small to medium the same as from medium to large? We cannot tell.",
   "So, is a large twice as big as a small? From this column, we cannot say.",
   "Now the price column: three, four, five, four, four and three dollars.",
   "Careful: price is what a drink costs, not how big it is. It is a different column.",
   "Prices can be ranked: five dollars is more than three dollars.",
   "Prices allow a third question: how much more? Five dollars is two dollars more than three.",
   "Every dollar is the same amount. So the gaps are equal.",
   "Three to four is one dollar, and four to five is one dollar.",
   "Price also has a true zero. Zero dollars means free: no money at all.",
   "Because zero means nothing, prices allow a fourth question: how many times as much?",
   "Imagine a six-dollar order. It costs twice a three-dollar order: three dollars, then three dollars more.",
   "Let's stack our four questions, like the steps of a ladder.",
   "Step one: same or different? Step two: which is more?",
   "Step three: how much more? Step four: how many times as much?",
   "A column that reaches a step can also answer the steps below it. Prices can still be the same, or more.",
   "The highest step a column reaches is called its measurement scale.",
   "Drink reaches step one. This is a nominal scale. Nominal means \"names only\".",
   "Size reaches step two. This is an ordinal scale. Ordinal means \"in order\".",
   "Some columns stop at step three. A thermometer in degrees Celsius is like that.",
   "Its gaps are equal, but zero degrees is only the freezing point of water. It is not \"no heat\".",
   "So twenty degrees is not twice as hot as ten. This is an interval scale. An interval is a gap.",
   "Price reaches step four. This is a ratio scale. A ratio is a \"how many times\" comparison.",
   "Here is a common trap. Someone types the sizes as numbers: small is one, medium two, large three.",
   "Now the column looks like numbers, and three looks like three times one.",
   "But these numbers only mark positions in the order. They do not say a large is three times a small.",
   "Writing a value as a number does not change its scale.",
   "This is what scales are for: before you calculate, check how high the column reaches.",
   "The owner can add up prices: the six orders bring in twenty-three dollars.",
   "Adding up sizes gives nothing useful. Small plus large is not a size.",
   "In short: drink is nominal, size is ordinal, price is ratio, and the scale tells you which comparisons make sense."
  ],
  "timing": [
   [
    0.8,
    7.77
   ],
   [
    8.22,
    13.39
   ],
   [
    13.84,
    19.04
   ],
   [
    19.49,
    23.93
   ],
   [
    24.38,
    28.27
   ],
   [
    28.72,
    34.68
   ],
   [
    35.13,
    40.35
   ],
   [
    40.8,
    47.03
   ],
   [
    47.48,
    52.13
   ],
   [
    52.58,
    58.04
   ],
   [
    58.49,
    62.73
   ],
   [
    63.18,
    66.1
   ],
   [
    66.55,
    70.61
   ],
   [
    71.06,
    74.15
   ],
   [
    74.6,
    79.94
   ],
   [
    80.39,
    85.22
   ],
   [
    85.67,
    91.3
   ],
   [
    91.75,
    97.03
   ],
   [
    97.48,
    101.26
   ],
   [
    101.71,
    107.46
   ],
   [
    107.91,
    110.94
   ],
   [
    111.39,
    115.69
   ],
   [
    116.14,
    120.89
   ],
   [
    121.34,
    127.2
   ],
   [
    127.65,
    134.85
   ],
   [
    135.3,
    138.17
   ],
   [
    138.62,
    142.92
   ],
   [
    143.37,
    147.99
   ],
   [
    148.44,
    154.61
   ],
   [
    155.06,
    158.33
   ],
   [
    158.78,
    163.79
   ],
   [
    164.24,
    168.89
   ],
   [
    169.34,
    174.39
   ],
   [
    174.84,
    181.1
   ],
   [
    181.55,
    188.08
   ],
   [
    188.53,
    194.5
   ],
   [
    194.95,
    202.16
   ],
   [
    202.61,
    206.6
   ],
   [
    207.05,
    213.03
   ],
   [
    213.48,
    216.59
   ],
   [
    217.04,
    222.02
   ],
   [
    222.47,
    226.53
   ],
   [
    226.98,
    232.24
   ],
   [
    232.69,
    240.71
   ]
  ],
  "T": 242.11,
  "video": "../ds-course-u01/video/1.1.4",
  "sim": true
 },
 "1.1.5": {
  "title": "Discrete and continuous values",
  "kicker": "1.1.5 · DISCRETE OR CONTINUOUS",
  "texts": [
   "Discrete values come in separate steps: drinks",
   "Continuous values can be any amount: a wait",
   "Test: can another amount fit in between?"
  ],
  "sentences": [
   "Imagine you own a small café, and you keep a notebook of the morning's orders.",
   "Between eight and nine o'clock, six orders were written down. Each order is one drink.",
   "You ask two questions. How many drinks did we sell? And how long did people wait?",
   "Each answer is a number. But they are two very different kinds of number. Let's see why.",
   "Start with the drinks. We sell them one whole cup at a time, and keep a tally.",
   "One. Two. Three. Four. Five. Six.",
   "The tally jumps one, two, three. It never shows anything in between.",
   "Could it ever stop halfway, between two and three? Think for a moment.",
   "No. Each cup adds exactly one. Between two and three, there is nothing to stop at.",
   "Now the waits. The notebook gives each wait in seconds.",
   "Let's place each wait as a dot on a line, with zero seconds on the left.",
   "The first order waited one hundred and twenty seconds.",
   "The second waited ninety seconds.",
   "The third, one hundred and fifty.",
   "The fourth, sixty.",
   "The fifth, one hundred and eighty.",
   "And the sixth, sixty again, so its dot stacks on the fourth one.",
   "Now let's zoom in on the short stretch from ninety to ninety-one seconds.",
   "Could a real wait end right in the middle, at ninety and a half seconds? Yes.",
   "Zoom in again: ninety and a quarter seconds fits in between too.",
   "Time flows without breaks. A wait can end anywhere along this line.",
   "Think of a staircase. As you climb, your height jumps from step to step.",
   "Now think of a ramp. As you walk up, your height can be any amount.",
   "The drinks are the staircase. The wait is the ramp.",
   "Now the names. Each number we write down, like one wait, is called a value.",
   "Values that come in separate steps, with nothing in between, are called discrete.",
   "Discrete means separate.",
   "Values that can be any amount along a line, with no gaps, are called continuous.",
   "Continuous means unbroken.",
   "Here is a test you can use. Pick two possible values, as close together as you can.",
   "Ask yourself: can another amount fit between them?",
   "Drinks: two and three are as close as they get. Nothing fits between them.",
   "So the number of drinks is discrete.",
   "Waits: however close two waits are, another amount still fits between them.",
   "So a wait is continuous.",
   "A handy guide: discrete values usually come from counting. Continuous values usually come from measuring.",
   "Why does this matter? First, it helps you spot mistakes.",
   "If a note says six and a half orders came in, that cannot be right.",
   "But a wait of ninety and a half seconds makes perfect sense.",
   "Second, later in the course, the kind of number decides which charts and tools fit.",
   "For example, counts are often drawn as separate bars, one for each whole number.",
   "Now a common trap. Our notebook shows only whole seconds, like ninety or sixty.",
   "That is only because the clock shows whole seconds. A finer stopwatch could show ninety and a half.",
   "The wait itself is still continuous. Do not decide by how the number is written.",
   "Recap: drinks come in separate steps, so they are discrete. A wait can be any amount, so it is continuous."
  ],
  "timing": [
   [
    0.8,
    5.22
   ],
   [
    5.67,
    10.71
   ],
   [
    11.16,
    15.9
   ],
   [
    16.35,
    21.21
   ],
   [
    21.66,
    26.18
   ],
   [
    26.63,
    31.14
   ],
   [
    31.59,
    36.26
   ],
   [
    36.71,
    40.74
   ],
   [
    41.19,
    46.92
   ],
   [
    47.37,
    51.23
   ],
   [
    51.68,
    56.14
   ],
   [
    56.59,
    59.25
   ],
   [
    59.7,
    61.81
   ],
   [
    62.26,
    63.81
   ],
   [
    64.26,
    65.32
   ],
   [
    65.77,
    67.23
   ],
   [
    67.68,
    71.45
   ],
   [
    71.9,
    76.06
   ],
   [
    76.51,
    82.09
   ],
   [
    82.54,
    86.41
   ],
   [
    86.86,
    91.21
   ],
   [
    91.66,
    96.02
   ],
   [
    96.47,
    100.69
   ],
   [
    101.14,
    104.18
   ],
   [
    104.63,
    109.34
   ],
   [
    109.79,
    114.65
   ],
   [
    115.1,
    116.74
   ],
   [
    117.19,
    122.47
   ],
   [
    122.92,
    124.89
   ],
   [
    125.34,
    130.23
   ],
   [
    130.68,
    133.41
   ],
   [
    133.86,
    138.54
   ],
   [
    138.99,
    140.94
   ],
   [
    141.39,
    146.36
   ],
   [
    146.81,
    148.61
   ],
   [
    149.06,
    155.3
   ],
   [
    155.75,
    159.14
   ],
   [
    159.59,
    163.17
   ],
   [
    163.62,
    167.15
   ],
   [
    167.6,
    172.94
   ],
   [
    173.39,
    178.59
   ],
   [
    179.04,
    184.29
   ],
   [
    184.74,
    190.73
   ],
   [
    191.18,
    195.95
   ],
   [
    196.4,
    203.51
   ]
  ],
  "T": 204.91,
  "video": "../ds-course-u01/video/1.1.5",
  "sim": true
 },
 "1.1.6": {
  "title": "Units of measurement: same wait, new number",
  "kicker": "1.1.6 · UNITS OF MEASUREMENT",
  "texts": [
   "The unit says what we count in",
   "Seconds ÷ 60 = minutes",
   "Same unit before you compare"
  ],
  "sentences": [
   "Let's go back to the café notebook from this chapter. Six customers ordered drinks one morning.",
   "The owner made a promise: no customer waits more than three minutes for a drink.",
   "Did she keep it? Look at the wait column, the list of numbers running down the table.",
   "It says how long each customer waited.",
   "The largest number in it is one hundred and eighty.",
   "That is far more than three. Did she break her promise?",
   "Hold on. Look at the top of the column. It says: seconds.",
   "The promise was in minutes. The column is in seconds.",
   "A second is one short tick of the clock. One minute is sixty of those ticks.",
   "Let's start with the first customer: one hundred and twenty seconds.",
   "Here are one hundred and twenty small dots, one dot for each second.",
   "Let's gather the dots into groups of sixty. Each group is one minute.",
   "One group, two groups, and no dots left over.",
   "So one hundred and twenty seconds is two minutes.",
   "Not one dot was added or removed. We only grouped them.",
   "The wait itself is the same. We counted it in bigger pieces, so we needed fewer of them.",
   "What we count in is called the unit. Seconds are one unit. Minutes are another.",
   "Smaller unit, bigger number. Bigger unit, smaller number.",
   "Now the second customer: ninety seconds.",
   "One full group of sixty. Thirty dots are left over.",
   "Thirty is half of sixty. So those thirty dots make half a minute.",
   "So ninety seconds is one and a half minutes. On paper, we write it one point five.",
   "Putting the seconds into equal groups of sixty, and counting the groups, is called dividing by sixty.",
   "A part-full group still counts, as a part.",
   "The third customer waited one hundred and fifty seconds.",
   "Two full groups of sixty use one hundred and twenty dots.",
   "Thirty dots are left: half a group.",
   "So that is two and a half minutes.",
   "Customers four and six each waited sixty seconds. That is exactly one group: one minute.",
   "Customer five is the big one: one hundred and eighty seconds.",
   "One, two, three groups, and nothing left over. That is three minutes.",
   "We write the new unit at the top of the column: minutes.",
   "Now the waits read: two, one and a half, two and a half, one, three, and one.",
   "The longest is exactly three, not more. The owner kept her promise.",
   "As a short rule, called a formula: minutes are the seconds, divided by sixty.",
   "For example, one hundred and eighty divided by sixty is three.",
   "This is what units are for: they tell you whether two numbers measure in the same way.",
   "Whenever you compare a number with a promise, or with another number, check the units first.",
   "The trap is to put one hundred and eighty next to three, as if both were minutes.",
   "So change every number to one unit, then compare.",
   "In one sentence: changing the unit changes the number, but never the wait itself."
  ],
  "timing": [
   [
    0.8,
    6.01
   ],
   [
    6.46,
    10.91
   ],
   [
    11.36,
    15.85
   ],
   [
    16.3,
    18.27
   ],
   [
    18.72,
    20.94
   ],
   [
    21.39,
    24.32
   ],
   [
    24.77,
    28.6
   ],
   [
    29.05,
    32.32
   ],
   [
    32.77,
    37.75
   ],
   [
    38.2,
    41.43
   ],
   [
    41.88,
    45.36
   ],
   [
    45.81,
    50.0
   ],
   [
    50.45,
    53.58
   ],
   [
    54.03,
    56.49
   ],
   [
    56.94,
    60.18
   ],
   [
    60.63,
    66.21
   ],
   [
    66.66,
    70.97
   ],
   [
    71.42,
    75.27
   ],
   [
    75.72,
    78.39
   ],
   [
    78.84,
    82.61
   ],
   [
    83.06,
    87.39
   ],
   [
    87.84,
    93.25
   ],
   [
    93.7,
    100.39
   ],
   [
    100.84,
    103.09
   ],
   [
    103.54,
    106.35
   ],
   [
    106.8,
    109.97
   ],
   [
    110.42,
    112.67
   ],
   [
    113.12,
    114.86
   ],
   [
    115.31,
    121.61
   ],
   [
    122.06,
    125.93
   ],
   [
    126.38,
    130.78
   ],
   [
    131.23,
    134.49
   ],
   [
    134.94,
    140.73
   ],
   [
    141.18,
    146.01
   ],
   [
    146.46,
    151.52
   ],
   [
    151.97,
    156.1
   ],
   [
    156.55,
    161.07
   ],
   [
    161.52,
    166.08
   ],
   [
    166.53,
    170.75
   ],
   [
    171.2,
    174.45
   ],
   [
    174.9,
    180.01
   ]
  ],
  "T": 181.41,
  "video": "../ds-course-u01/video/1.1.6",
  "sim": true
 },
 "1.1.7": {
  "title": "Ratios and percentages: three out of six",
  "kicker": "1.1.7 · RATIOS AND PERCENTAGES",
  "texts": [
   "Ratio: part with part (1 to 1)",
   "Fraction: part with whole (3/6 = 1/2)",
   "Percent: out of 100 (50%)"
  ],
  "sentences": [
   "Here is our café table again, with its six morning orders.",
   "Some customers leave with their drink. This is called takeaway. Others stay and drink in the café.",
   "The owner wonders: how much of our business is takeaway?",
   "The last column answers yes or no for each order.",
   "Let's draw each order as a cup. A filled cup is a takeaway order.",
   "Order one: yes. Order two: no. Order three: yes.",
   "Order four: no. Order five: yes. Order six: no.",
   "Let's count the filled cups: one, two, three. Three takeaway orders.",
   "But is three a lot? Three out of six is very different from three out of a hundred.",
   "So one number is not enough. Three, compared with what?",
   "One way: compare takeaway with staying. Three filled cups, and three empty cups.",
   "Pair each filled cup with an empty one. There is one takeaway for each one that stays.",
   "Comparing one part with another part is called a ratio. Here the ratio is one to one.",
   "The other way: compare the takeaway orders with all the orders.",
   "The takeaway orders are the part. All six orders together are the whole.",
   "We write the part on top, the whole below, and a line between. This is called a fraction.",
   "Three on top, six below. We read it as three out of six.",
   "Can we say it in an easier way? Let's slide the three filled cups together.",
   "Now the six cups make two equal piles, with three cups in each pile.",
   "The takeaway cups fill one pile out of two. That is one half.",
   "Three out of six and one out of two are the same amount.",
   "So we can answer the owner: half of the morning orders were takeaway.",
   "Next, picture the same half with a bigger whole: a square of a hundred small boxes.",
   "We fill half of them: fifty boxes out of one hundred.",
   "Saying how many out of a hundred is called a percentage. Per cent means per hundred.",
   "So one half is fifty percent. We write fifty, then the percent sign.",
   "Imagine a bigger café down the street. It had twenty-five orders, and ten were takeaway.",
   "Ten sounds like more than our three. But their whole is bigger too.",
   "Let's turn their whole into a hundred. Picture four cafés just like theirs: a hundred orders.",
   "Each one has ten takeaways. So the four have ten, twenty, thirty, forty.",
   "They have forty out of a hundred: forty percent. We have fifty.",
   "So a larger part of our orders are takeaway. But remember, ours comes from only six orders.",
   "This is what a percentage is for. With the same whole, a hundred, different groups can be compared.",
   "Last, the short rule in numbers.",
   "The line in a fraction means divided by. Three divided by six is one half, as the cups showed.",
   "Then multiply by one hundred, to count out of a hundred. One half of a hundred is fifty.",
   "In one line: percent equals part, divided by whole, times one hundred.",
   "Here is the trap. A percentage does not tell you how many orders were counted.",
   "Our fifty percent comes from only six orders.",
   "Suppose one customer who stayed had chosen takeaway instead.",
   "Then it is four out of six. A calculator says that is about sixty-seven percent.",
   "One single customer moved us from fifty to sixty-seven. Small groups jump easily.",
   "So when you hear a percentage, ask: out of how many?",
   "In short: a fraction compares part with whole, and a percentage uses a whole of a hundred."
  ],
  "timing": [
   [
    0.8,
    4.71
   ],
   [
    5.16,
    11.08
   ],
   [
    11.53,
    14.81
   ],
   [
    15.26,
    18.77
   ],
   [
    19.22,
    22.8
   ],
   [
    23.25,
    27.53
   ],
   [
    27.98,
    32.3
   ],
   [
    32.75,
    37.22
   ],
   [
    37.67,
    42.45
   ],
   [
    42.9,
    45.78
   ],
   [
    46.23,
    52.02
   ],
   [
    52.47,
    57.92
   ],
   [
    58.37,
    63.67
   ],
   [
    64.12,
    67.46
   ],
   [
    67.91,
    71.73
   ],
   [
    72.18,
    77.06
   ],
   [
    77.51,
    81.38
   ],
   [
    81.83,
    86.3
   ],
   [
    86.75,
    91.05
   ],
   [
    91.5,
    95.33
   ],
   [
    95.78,
    99.76
   ],
   [
    100.21,
    103.56
   ],
   [
    104.01,
    109.11
   ],
   [
    109.56,
    112.73
   ],
   [
    113.18,
    117.83
   ],
   [
    118.28,
    122.87
   ],
   [
    123.32,
    129.13
   ],
   [
    129.58,
    133.15
   ],
   [
    133.6,
    139.04
   ],
   [
    139.49,
    144.75
   ],
   [
    145.2,
    148.91
   ],
   [
    149.36,
    154.59
   ],
   [
    155.04,
    160.43
   ],
   [
    160.88,
    163.19
   ],
   [
    163.64,
    170.11
   ],
   [
    170.56,
    175.76
   ],
   [
    176.21,
    180.87
   ],
   [
    181.32,
    185.93
   ],
   [
    186.38,
    189.03
   ],
   [
    189.48,
    193.08
   ],
   [
    193.53,
    198.5
   ],
   [
    198.95,
    205.06
   ],
   [
    205.51,
    208.86
   ],
   [
    209.31,
    215.27
   ]
  ],
  "T": 216.67,
  "video": "../ds-course-u01/video/1.1.7",
  "sim": true
 },
 "1.1.8": {
  "title": "Reading a formula: the adding-up sign",
  "kicker": "1.1.8 · READING A FORMULA",
  "texts": [
   "Sigma means: add up",
   "Below: start. Above: stop. Right: what to add",
   "Six prices add up to 23 dollars"
  ],
  "sentences": [
   "Imagine you run a small café.",
   "Between eight and nine this morning, you served six orders.",
   "Each order has a price, in dollars.",
   "At nine o'clock, you wonder: how much money came in this hour?",
   "The money that comes in from sales is called revenue.",
   "Here are the six prices, one by one, all in dollars.",
   "Order one: three dollars.",
   "Order two: four.",
   "Order three: five.",
   "Order four: four.",
   "Order five: four.",
   "Order six: three.",
   "To find the revenue, we add the prices, one at a time.",
   "Start with three. Plus four makes seven.",
   "Plus five makes twelve.",
   "Plus four makes sixteen.",
   "Plus four makes twenty.",
   "Plus three makes twenty-three.",
   "The answer you get by adding up a list is called the sum.",
   "Here, the sum is twenty-three dollars. That is the revenue.",
   "With six hundred orders, writing every plus sign would fill pages.",
   "A formula is a short rule, written with signs. Formulas use one sign that means: add them all up.",
   "Let's learn to read it, in two small steps.",
   "Step one: x stands for a price. Here, a letter is only a short name.",
   "To pick one price, we write the order's number next to the x, small and a little lower.",
   "So x one means the price of order one: three dollars.",
   "x two means the price of order two: four dollars.",
   "And so on, down to x six: three dollars.",
   "This is a name, not a multiplication. Nothing is multiplied here.",
   "Now we want one name that works for any order.",
   "So in place of the small number, we write a small letter i.",
   "Think of i as a counter, like a finger moving down the list.",
   "It starts at one, then goes up by one each time.",
   "When the counter is at one, x i is x one: three dollars.",
   "When it is at three, x i is x three: five dollars.",
   "When it is at six, x i is x six: three dollars.",
   "So x i always means: the price the counter is pointing at.",
   "Step two: the sign itself. Here it is.",
   "Its name is sigma, a Greek letter. You only need its look and its meaning: add up.",
   "Now let's read the small parts around it, one at a time.",
   "Below the sign: i equals one. That means: the counter starts at one.",
   "Above the sign: six. That means: the last order to add is order six.",
   "To the right of the sign: x i. That is what we add each time: the price.",
   "In everyday words, the whole line says: add the prices of orders one to six.",
   "Let's follow it, the same way we added before.",
   "The counter starts at one. x one is three.",
   "Counter two: x two is four. Three plus four makes seven.",
   "Counter three: x three is five. Plus five makes twelve.",
   "Counter four: x four is four. Plus four makes sixteen.",
   "Counter five: x five is four. Plus four makes twenty.",
   "Counter six: x six is three. Plus three makes twenty-three.",
   "Six was the number on top. We added order six, so now we stop.",
   "The sum is twenty-three dollars: the same as by hand.",
   "This is what the sign is for: it writes a long sum in one short line.",
   "With six hundred orders, only the number on top changes, from six to six hundred.",
   "Many formulas in this course start with this sign. Now you can read them.",
   "A common trap. The order numbers, one to six, are numbers too.",
   "It is easy to add them by mistake. One plus two plus three, up to six, makes twenty-one.",
   "But the revenue is twenty-three. The counter only says which price.",
   "What we add is what stands to the right of the sign.",
   "To recap: the sigma sign means add up.",
   "Add the thing on its right, from the number below to the number on top.",
   "In the next lesson, we turn the question \"how busy are we?\" into orders per hour."
  ],
  "timing": [
   [
    0.8,
    2.44
   ],
   [
    2.89,
    6.43
   ],
   [
    6.88,
    8.96
   ],
   [
    9.41,
    12.89
   ],
   [
    13.34,
    16.05
   ],
   [
    16.5,
    20.18
   ],
   [
    20.63,
    22.44
   ],
   [
    22.89,
    23.85
   ],
   [
    24.3,
    25.85
   ],
   [
    26.3,
    27.58
   ],
   [
    28.03,
    29.32
   ],
   [
    29.77,
    31.23
   ],
   [
    31.68,
    35.22
   ],
   [
    35.67,
    38.11
   ],
   [
    38.56,
    39.91
   ],
   [
    40.36,
    41.83
   ],
   [
    42.28,
    43.54
   ],
   [
    43.99,
    45.86
   ],
   [
    46.31,
    49.08
   ],
   [
    49.53,
    53.1
   ],
   [
    53.55,
    57.87
   ],
   [
    58.32,
    64.81
   ],
   [
    65.26,
    67.66
   ],
   [
    68.11,
    72.37
   ],
   [
    72.82,
    77.88
   ],
   [
    78.33,
    82.04
   ],
   [
    82.49,
    85.96
   ],
   [
    86.41,
    89.47
   ],
   [
    89.92,
    94.18
   ],
   [
    94.63,
    96.86
   ],
   [
    97.31,
    100.46
   ],
   [
    100.91,
    104.92
   ],
   [
    105.37,
    107.97
   ],
   [
    108.42,
    112.95
   ],
   [
    113.4,
    117.72
   ],
   [
    118.17,
    122.29
   ],
   [
    122.74,
    126.21
   ],
   [
    126.66,
    129.46
   ],
   [
    129.91,
    135.38
   ],
   [
    135.83,
    138.51
   ],
   [
    138.96,
    143.69
   ],
   [
    144.14,
    149.81
   ],
   [
    150.26,
    155.35
   ],
   [
    155.8,
    161.19
   ],
   [
    161.64,
    163.9
   ],
   [
    164.35,
    166.77
   ],
   [
    167.22,
    171.9
   ],
   [
    172.35,
    176.35
   ],
   [
    176.8,
    180.6
   ],
   [
    181.05,
    184.86
   ],
   [
    185.31,
    189.97
   ],
   [
    190.42,
    194.13
   ],
   [
    194.58,
    197.72
   ],
   [
    198.17,
    202.5
   ],
   [
    202.95,
    207.45
   ],
   [
    207.9,
    211.88
   ],
   [
    212.33,
    216.57
   ],
   [
    217.02,
    223.0
   ],
   [
    223.45,
    227.62
   ],
   [
    228.07,
    230.23
   ],
   [
    230.68,
    233.36
   ],
   [
    233.81,
    237.36
   ],
   [
    237.81,
    243.33
   ]
  ],
  "T": 244.73,
  "video": "../ds-course-u01/video/1.1.8",
  "sim": true
 },
 "1.1.9": {
  "title": "From question to quantity: how busy are we?",
  "kicker": "1.1.9 · FROM QUESTION TO QUANTITY",
  "texts": [
   "Choose what to count, and over how long",
   "Rate = orders ÷ hours",
   "Compare per hour, not raw totals"
  ],
  "sentences": [
   "Imagine you own the small café from this chapter.",
   "At the end of the morning, your manager asks: how busy were we?",
   "\"Quite busy\" is an answer, but it is a feeling, not a number.",
   "You cannot compare a feeling with yesterday.",
   "So let's turn the question into something we can count.",
   "Here is our notebook again. Each row is one order: one customer buying one drink.",
   "Each order also has a time, from eight oh five to eight fifty-two.",
   "Let's place each order as a dot on a time line, from eight o'clock to nine o'clock.",
   "First choice: what do we count? Here, we count orders.",
   "The thing we choose to count is called a quantity. Our quantity is the number of orders.",
   "Second choice: over how much time? Here, one hour, from eight to nine.",
   "Now we count the dots: one, two, three, four, five, six.",
   "Six orders in one hour.",
   "Now here is yesterday's notebook, with its own dots. It shows nine orders.",
   "Nine is more than six. So was yesterday busier?",
   "Look at its time line. It runs from eight to eleven: three hours, not one.",
   "More hours give more time for orders. So nine against six is not a fair match.",
   "To compare fairly, we ask each day the same question: how many orders in one hour?",
   "Let's pretend yesterday's nine orders were spread evenly over its three hours.",
   "We deal them out, one order to each hour, again and again.",
   "Each hour gets three orders.",
   "Sharing equally like this is called dividing. Nine divided by three is three.",
   "Today already covers exactly one hour, so it stays six.",
   "\"Six orders in one hour\" has a shorter way to say it. Per means \"for each\".",
   "Today: six orders per hour. Yesterday: three orders per hour.",
   "Orders for each hour is called a rate. A rate tells the pace.",
   "A car's speed works the same way: sixty kilometres per hour, sixty for each hour.",
   "Three, and three again, makes six. So today had twice as many orders per hour as yesterday.",
   "And that is true even though today had fewer orders in total.",
   "Now let's write what we did as a short line, called a formula.",
   "Orders per hour equals the number of orders,",
   "divided by the number of hours.",
   "Yesterday: nine orders, divided by three hours, makes three orders per hour.",
   "Today: six orders, divided by one hour, stays six. Sharing over one hour changes nothing.",
   "This is what a rate is for: comparing two days fairly, even when they lasted different times.",
   "Now a warning. A rate is the pace as if the orders were spread evenly. It can hide a rush.",
   "Yesterday, one hour may have had six orders and another hour none. The rate still says three.",
   "And \"busy\" could also mean a long queue. That would be a different quantity: the wait.",
   "So always say what you counted, and over how much time.",
   "In one line: to compare how busy two times were, count the orders, then divide by the hours.",
   "That ends this chapter about what a table of data records.",
   "Next, we count how often each wait appears, and we find one typical wait."
  ],
  "timing": [
   [
    0.8,
    3.42
   ],
   [
    3.87,
    7.58
   ],
   [
    8.03,
    12.39
   ],
   [
    12.84,
    14.84
   ],
   [
    15.29,
    18.04
   ],
   [
    18.49,
    23.56
   ],
   [
    24.01,
    28.3
   ],
   [
    28.75,
    33.87
   ],
   [
    34.32,
    37.5
   ],
   [
    37.95,
    43.02
   ],
   [
    43.47,
    48.33
   ],
   [
    48.78,
    53.63
   ],
   [
    54.08,
    55.37
   ],
   [
    55.82,
    60.64
   ],
   [
    61.09,
    64.19
   ],
   [
    64.64,
    69.34
   ],
   [
    69.79,
    75.06
   ],
   [
    75.51,
    80.83
   ],
   [
    81.28,
    86.12
   ],
   [
    86.57,
    90.4
   ],
   [
    90.85,
    92.43
   ],
   [
    92.88,
    98.01
   ],
   [
    98.46,
    102.64
   ],
   [
    103.09,
    107.54
   ],
   [
    107.99,
    112.29
   ],
   [
    112.74,
    116.59
   ],
   [
    117.04,
    122.49
   ],
   [
    122.94,
    129.69
   ],
   [
    130.14,
    133.74
   ],
   [
    134.19,
    137.16
   ],
   [
    137.61,
    140.13
   ],
   [
    140.58,
    142.06
   ],
   [
    142.51,
    148.4
   ],
   [
    148.85,
    156.12
   ],
   [
    156.57,
    162.53
   ],
   [
    162.98,
    169.39
   ],
   [
    169.84,
    175.86
   ],
   [
    176.31,
    181.13
   ],
   [
    181.58,
    184.55
   ],
   [
    185.0,
    191.12
   ],
   [
    191.57,
    194.44
   ],
   [
    194.89,
    200.06
   ]
  ],
  "T": 201.46,
  "video": "../ds-course-u01/video/1.1.9",
  "sim": true
 },
 "1.2.1": {
  "title": "Frequency tables: turning a list into neat counts",
  "kicker": "1.2.1 · FREQUENCY TABLES",
  "texts": [
   "Frequency = how many times",
   "Rows with zero show gaps",
   "Sum of frequencies = total"
  ],
  "sentences": [
   "Imagine our café on a quiet morning shift.",
   "Eight customers wait for coffee, and you note each wait in whole minutes.",
   "The owner asks: which wait time happened most often?",
   "In arrival order, the first four wait three, one, four, and two minutes.",
   "Next come three, six, two, and three minutes.",
   "These eight wait times are our data: the numbers we collected.",
   "Even eight numbers feel jumbled in that order.",
   "Imagine scanning eight hundred customers this way.",
   "Notice that several wait times repeat.",
   "Think of sorting loose coins into piles to count each size.",
   "Let's group matching wait times and count each group.",
   "Each group's count is its frequency.",
   "Like the word frequent, frequency means how many times something happens.",
   "Give each wait time its own row beside its frequency: that is a frequency table.",
   "First, find the shortest and longest waits: one and six minutes.",
   "Make a row for each whole minute from one through six.",
   "For each customer, add a tick, called a tally mark, to the matching row.",
   "Three minutes gets one mark in the three-minute row.",
   "One, four, and two minutes each get a mark.",
   "Three minutes again adds a second mark.",
   "Six minutes gets one mark, and two minutes gets a second.",
   "Last, three minutes gets a third mark.",
   "Now turn each row's marks into its frequency.",
   "The one-minute row has a single mark, so one customer waited that long.",
   "Two customers waited two minutes, and three customers waited three minutes.",
   "One customer waited four minutes.",
   "Look at the five-minute row: how many marks?",
   "None, so zero customers waited five minutes.",
   "Keeping a row with zero is optional, and it shows the gap before six.",
   "Finally, one customer waited six minutes.",
   "Next, check we did not skip or double-count anyone.",
   "Add the frequencies: one plus two plus three makes six.",
   "Add one, zero, and one more to reach eight.",
   "Adding numbers gives their sum: eight, matching our eight customers.",
   "So everyone is counted.",
   "The sum of the frequencies always equals the total.",
   "Back to the owner's question: which wait time happened most often?",
   "Three minutes: three of our eight customers waited that long.",
   "A frequency table turns a messy list into clear counts for one group.",
   "Watch out for one trap when comparing groups of different sizes.",
   "Suppose a café across town serves one hundred customers, and four wait three minutes.",
   "Across town, more customers waited three minutes: four instead of three.",
   "Yet here, a bigger share of customers waited three minutes.",
   "Three of eight is almost half our shift.",
   "Four of one hundred is just a tiny handful.",
   "Next time, we turn counts into shares to compare groups of any size.",
   "To recap: a frequency table gives each wait time its own row and shows how many customers had that wait."
  ],
  "timing": [
   [
    0.8,
    3.43
   ],
   [
    3.88,
    8.42
   ],
   [
    8.87,
    11.98
   ],
   [
    12.43,
    17.46
   ],
   [
    17.91,
    21.53
   ],
   [
    21.98,
    25.16
   ],
   [
    25.61,
    27.94
   ],
   [
    28.39,
    31.34
   ],
   [
    31.79,
    33.86
   ],
   [
    34.31,
    38.28
   ],
   [
    38.73,
    41.42
   ],
   [
    41.87,
    44.04
   ],
   [
    44.49,
    48.96
   ],
   [
    49.41,
    54.53
   ],
   [
    54.98,
    59.82
   ],
   [
    60.27,
    63.25
   ],
   [
    63.7,
    68.03
   ],
   [
    68.48,
    71.02
   ],
   [
    71.47,
    74.61
   ],
   [
    75.06,
    77.3
   ],
   [
    77.75,
    80.88
   ],
   [
    81.33,
    83.41
   ],
   [
    83.86,
    86.63
   ],
   [
    87.08,
    90.89
   ],
   [
    91.34,
    96.05
   ],
   [
    96.5,
    98.16
   ],
   [
    98.61,
    101.06
   ],
   [
    101.51,
    104.5
   ],
   [
    104.95,
    109.56
   ],
   [
    110.01,
    112.55
   ],
   [
    113.0,
    115.93
   ],
   [
    116.38,
    120.69
   ],
   [
    121.14,
    124.24
   ],
   [
    124.69,
    129.05
   ],
   [
    129.5,
    130.62
   ],
   [
    131.07,
    134.09
   ],
   [
    134.54,
    137.97
   ],
   [
    138.42,
    141.72
   ],
   [
    142.17,
    146.65
   ],
   [
    147.1,
    150.66
   ],
   [
    151.11,
    156.35
   ],
   [
    156.8,
    161.29
   ],
   [
    161.74,
    165.34
   ],
   [
    165.79,
    167.98
   ],
   [
    168.43,
    170.82
   ],
   [
    171.27,
    175.78
   ],
   [
    176.23,
    182.74
   ]
  ],
  "T": 184.14,
  "video": "../ds-course-u01/video/1.2.1",
  "sim": true
 },
 "1.2.4": {
  "title": "The mean: one fair share for a whole group",
  "kicker": "1.2.4 · THE ARITHMETIC MEAN",
  "texts": [
   "Mean = the fair share",
   "Sum ÷ count",
   "On average: 20 minutes"
  ],
  "sentences": [
   "Imagine a small class of seven students.",
   "You ask each one: how many minutes does your trip to class take?",
   "Let's hear the answers one by one, and place each one on a line marked in minutes.",
   "Ten minutes.",
   "Twelve.",
   "Fifteen.",
   "Eighteen.",
   "Twenty-five.",
   "Thirty.",
   "And thirty again.",
   "Each dot is one student. Short trips are on the left, long trips on the right.",
   "These seven answers are our data. Data means the answers we collected.",
   "Now a friend asks you: so, how long is the trip for your students?",
   "Seven different numbers are hard to remember. One number for the whole group would be easier.",
   "But which number? Let's look for each student's fair share.",
   "Let's draw each trip as a stack of small blocks. Each block is one minute.",
   "This is only a picture. Nobody's real trip will change.",
   "Now let's move blocks from the tall stacks to the short ones, one at a time.",
   "We never add or remove a block. We only move them, until all seven stacks are the same height.",
   "Look: every stack now has twenty blocks. That is each student's fair share: twenty minutes.",
   "Statisticians call this fair share the mean. In everyday talk, we also call it the average.",
   "Here, mean is not about being unkind. It is the name of this fair share.",
   "Why twenty, exactly? Look at the blocks we moved. They are all still here. Not one was lost.",
   "So the total number of blocks never changed.",
   "At the end, that same total sits in seven equal stacks.",
   "So each stack is the total, split into seven equal parts. That is the fair share.",
   "This gives us a faster way, with no moving at all.",
   "Step one: find the total. We add up the stacks, one student at a time.",
   "Ten plus twelve makes twenty-two.",
   "Plus fifteen makes thirty-seven.",
   "Plus eighteen makes fifty-five.",
   "Plus twenty-five makes eighty.",
   "Plus thirty makes one hundred and ten.",
   "Plus the last thirty makes one hundred and forty.",
   "So there are one hundred and forty blocks in total. This total is called the sum.",
   "Step two: share the total equally. How many blocks does each of the seven students get?",
   "The number of students, seven, is called the count.",
   "We deal the blocks into seven stacks, one block to each stack, again and again.",
   "When all the blocks are dealt, each stack has twenty.",
   "This equal sharing is called dividing.",
   "One hundred and forty divided by seven is twenty: the same twenty we found by moving blocks.",
   "Now we can write the two steps in one short line, called a formula.",
   "Mean equals sum, divided by count.",
   "In everyday words: add everything, then divide by how many.",
   "This is what the mean is for: it describes a whole group with one fair number.",
   "So, next time your friend asks, you can answer: on average, the trip takes twenty minutes.",
   "In the next lesson, we will see what else the mean is useful for, and when it can go wrong."
  ],
  "timing": [
   [
    0.8,
    3.77
   ],
   [
    4.22,
    7.8
   ],
   [
    8.25,
    12.83
   ],
   [
    13.28,
    14.0
   ],
   [
    14.45,
    14.97
   ],
   [
    15.42,
    16.01
   ],
   [
    16.46,
    17.0
   ],
   [
    17.45,
    18.21
   ],
   [
    18.66,
    19.1
   ],
   [
    19.55,
    20.48
   ],
   [
    20.93,
    25.6
   ],
   [
    26.05,
    30.12
   ],
   [
    30.57,
    34.63
   ],
   [
    35.08,
    39.85
   ],
   [
    40.3,
    40.89
   ],
   [
    41.34,
    45.8
   ],
   [
    46.25,
    49.78
   ],
   [
    50.23,
    54.17
   ],
   [
    54.62,
    60.51
   ],
   [
    60.96,
    66.91
   ],
   [
    67.36,
    72.95
   ],
   [
    73.4,
    77.84
   ],
   [
    78.29,
    83.69
   ],
   [
    84.14,
    86.53
   ],
   [
    86.98,
    90.69
   ],
   [
    91.14,
    96.61
   ],
   [
    97.06,
    100.27
   ],
   [
    100.72,
    105.24
   ],
   [
    105.69,
    107.97
   ],
   [
    108.42,
    110.23
   ],
   [
    110.68,
    112.69
   ],
   [
    113.14,
    114.86
   ],
   [
    115.31,
    117.45
   ],
   [
    117.9,
    120.49
   ],
   [
    120.94,
    125.0
   ],
   [
    125.45,
    130.71
   ],
   [
    131.16,
    133.69
   ],
   [
    134.14,
    139.6
   ],
   [
    140.05,
    143.0
   ],
   [
    143.45,
    145.38
   ],
   [
    145.83,
    151.29
   ],
   [
    151.74,
    155.26
   ],
   [
    155.71,
    157.99
   ],
   [
    158.44,
    163.07
   ],
   [
    163.52,
    167.88
   ],
   [
    168.33,
    174.07
   ],
   [
    174.52,
    179.66
   ]
  ],
  "T": 181.06,
  "video": "../ds-course-u01/video/1.2.4",
  "sim": true
 }
};
