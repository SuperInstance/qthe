# LICENSE NOTE (the honest gap)

`qthe-core` is a byte-exact extraction of files from
**github.com/SuperInstance/qthe**, which — at extraction time — **carries no
license file**. Until the repository owner adds one, no redistribution
rights are granted beyond what the source repo itself implies: treat this
package as **source-available, all rights reserved**.

Recommended fix (one commit, unblocks all downstream adoption):

```bash
cd SuperInstance/qthe && git add LICENSE && git commit -m "license: <chosen>"
```

MIT-0 / MIT / Apache-2.0 / BSD-2 are all compatible with the fleet's
zero-dependency, receipt-first posture; the choice is the owner's. This note
exists so the gap is priced, not hidden.
