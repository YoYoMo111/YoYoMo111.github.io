/*
 * Change color at different levels of scale.
 */
AFRAME.registerComponent('scale-y-opacity', {
  schema: {
    from: {default: 0},
    to: {default: 1},
    maxScale: {default: 20}
  },

  tick: function (time) {
    var data = this.data;
    var el = this.el;

    if (time - this.time < 50) { return; }
    this.time = time;

    var scaleY = el.getAttribute('scale').y;
    var percentage = scaleY / data.maxScale;
    el.setAttribute('material', 'opacity', ((data.to - data.from) * percentage + data.from));
  }
});

