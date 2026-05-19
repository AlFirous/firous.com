<div class="drag-area" id="area">
  <div class="drag-box" style="left:40px;top:40px;">Box 1</div>
  <div class="drag-box" style="left:130px;top:100px;">Box 2</div>
  <div class="drag-box" style="left:220px;top:50px;">Box 3</div>
</div>

<style>
  .drag-area {
    position: relative;
    width: 100%;
    height: 400px;
    overflow: hidden;
    touch-action: none;
    user-select: none;
  }
  .drag-box {
    position: absolute;
    width: 80px;
    height: 80px;
    cursor: grab;
  }
  .drag-box.dragging { cursor: grabbing; }
</style>

<script>
  let highestZ = 0;

  document.querySelectorAll('.drag-box').forEach(el => {
    let startX, startY, startLeft, startTop;
    const area = document.getElementById('area');

    function getPos(e) {
      return e.touches
        ? { x: e.touches[0].clientX, y: e.touches[0].clientY }
        : { x: e.clientX,            y: e.clientY };
    }

    function onStart(e) {
      e.preventDefault();
      const pos = getPos(e);
      startX    = pos.x;
      startY    = pos.y;
      startLeft = el.offsetLeft;
      startTop  = el.offsetTop;

      el.style.zIndex = ++highestZ; // always brings dragged element to front

      el.classList.add('dragging');
      document.addEventListener('mousemove', onMove);
      document.addEventListener('touchmove', onMove, { passive: false });
      document.addEventListener('mouseup',   onEnd);
      document.addEventListener('touchend',  onEnd);
    }

    function onMove(e) {
      e.preventDefault();
      const pos   = getPos(e);
      const areaW = area.clientWidth;
      const areaH = area.clientHeight;
      const newLeft = Math.min(Math.max(0, startLeft + pos.x - startX), areaW - el.offsetWidth);
      const newTop  = Math.min(Math.max(0, startTop  + pos.y - startY), areaH - el.offsetHeight);
      el.style.left = newLeft + 'px';
      el.style.top  = newTop  + 'px';
    }

    function onEnd() {
      el.classList.remove('dragging');
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('touchmove', onMove);
      document.removeEventListener('mouseup',   onEnd);
      document.removeEventListener('touchend',  onEnd);
    }

    el.addEventListener('mousedown',  onStart);
    el.addEventListener('touchstart', onStart, { passive: false });
  });
</script>
