/* esp32_demo.c — ORCH-23: multi-node demo entry point (ESP32/Jetson-class).
 * The Abstain wormhole is the ONLY non-local channel; nodes coordinate by
 * co-firing on shared slots. Build (ESP-IDF): idf.py add-component / link
 * qthe_core.c; or bare-metal: xtensa-esp32-elf-gcc -O2 -std=c99.
 * STATUS: code-delivered, hardware-pending (no physical device in the
 * orchestration environment — flash, run, seal the transcript on-device).
 * Deterministic: same seed -> same transcript, verifiable against the JS
 * reference via the plane hash (the conformance battery already proves the
 * kernel byte-exact). */
#include "qthe_core.h"
#include <stdio.h>
#include <string.h>

#define W 32
#define H 16
#define TICKS 200

int main(void) {
  /* three agent beacons, private candidate slots (the rendezvous demo) */
  uint8_t plane[W * H];
  memset(plane, 0, sizeof plane);
  struct { int x, y, slot; } agents[] = { {4, 4, 12}, {27, 3, 40}, {16, 13, 33} };
  for (unsigned i = 0; i < sizeof agents / sizeof agents[0]; i++)
    plane[agents[i].y * W + agents[i].x] = qthe_pack(3, agents[i].slot);

  qthe_substrate *s = qthe_make_substrate(W, H, plane);
  qthe_event events[64];
  char hash[65];
  qthe_plane_hash(s, 0, hash);
  printf("[esp32-demo] boot: %dx%d, 3 agent beacons, hash %.16s...\n", W, H, hash);

  for (int t = 1; t <= TICKS; t++) {
    int n = qthe_tick(s, 1, NULL, events, 64);
    /* agreement = all three beacons co-fire in one tick */
    int a = 0, b = 0, c = 0;
    for (int i = 0; i < n; i++) {
      if (events[i].x == 4 && events[i].y == 4) a = 1;
      if (events[i].x == 27 && events[i].y == 3) b = 1;
      if (events[i].x == 16 && events[i].y == 13) c = 1;
    }
    if (a && b && c) { printf("[esp32-demo] AGREEMENT at tick %d (slot %d)\n", t, events[0].slot); break; }
    if (t == 60 || t == 120) { /* adapt: advance candidate (injector, tau kept) */
      for (unsigned i = 0; i < sizeof agents / sizeof agents[0]; i++) {
        int idx = agents[i].y * W + agents[i].x;
        int d = s->cells[idx] & 63;
        int next = d == 12 ? 40 : d == 40 ? 33 : 12;
        s->cells[idx] = qthe_pack(3, next);
      }
    }
  }
  qthe_plane_hash(s, s->ticks, hash);
  printf("[esp32-demo] final: ticks=%lld hash=%.16s... (compare against JS reference)\n", (long long)s->ticks, hash);
  qthe_free_substrate(s);
  return 0;
}
