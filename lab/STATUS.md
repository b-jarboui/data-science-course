# "Algorithms in action" lab: status

Folder `site/lab/`. Open http://localhost:8655/lab/index.html (live: `/data-science-course/lab/index.html` after the next publish).

## Files
- `index.html` (5 tiles), `lab.css`, `kit.js` (shared: seeded random, HiDPI plots, charts, Play/Step/Reset bar, knobs, notice box, autotest)
- `mlp.js`: real neural network with backprop (shared by labs 2, 3, 5)
- one lab = `<name>.html` + `<name>.js` (page) + `algo-<name>.js` (pure maths, also checked under Node):
  `clustering` (algo-cluster), `classify` (algo-classify), `regression` (algo-regress), `optimizers` (algo-optim), `network` (algo-network)
- `_frame.html`: test helper only (phone-width frame for headless Chrome), not linked
- Course map: one link added by hand in `site/index.html` (header, above the stats line). That file is hand-written, not generated.

## Checks
- `node review/lab_selftest.mjs` : maths checks of every algorithm (all pass)
- `python review/lab_shots.py test <lab>` : in-page `?autotest=1` at 1366 px and in a 375 px frame (all pass, no sideways scroll)
- `python review/lab_shots.py shot <lab> "<query>" <name>` : screenshots in `review/lab_shots/` (`_laptop` 1366x768, `_laptop_full`, `_phone` 375x812 at 2x, `_phone_full`)
- URL options of every lab: `?data=<id>`, `?run=N` (do N steps at once), `?play=1`, `?speed=1..6`, `?autotest=1`

## Done
- [x] kit + CSS
- [x] Lab 1 clustering: k-means (random / k-means++), Gaussian mixture (EM), DBSCAN, hierarchical single link + Ward; 7 data sets
- [x] Lab 2 classification: logistic regression, k-NN, naive Bayes, tree, random forest, SVM (RBF), neural network; 6 data sets; train / test
- [x] Lab 3 regression: polynomial, k-NN, tree, neural network over 12 complexity levels; 6 data sets; train / test error curves
- [x] Lab 4 optimizers: gradient descent, momentum, RMSProp, Adam on 7 surfaces (2 are the real loss of a line fit)
- [x] Lab 5 big network: 4 networks side by side (activation / size / learning rate), digit images 12x12 + 4 two-input shapes, neuron views, draw-your-own digit
- [x] index page + course-map link
- [x] maths checks, autotests, screenshots on laptop and phone

## Not done / ideas for later
- Dimension reduction lab (PCA vs random projection): in the first plan as "later", not built
- Links from the last lesson of each related chapter (needs the lesson pages, outside `site/lab/`)
- Web workers: not needed so far (every step is time-boxed on the main thread); the largest settings (6 x 32 network, 800 points in Lab 2) are slower on a phone
- Not published: no git, no ds_publish.py was run
