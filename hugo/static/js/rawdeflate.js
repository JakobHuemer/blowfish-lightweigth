var deflate = (function () {
  var zip_WSIZE = 32768;
  var zip_STORED_BLOCK = 0;
  var zip_STATIC_TREES = 1;
  var zip_DYN_TREES = 2;
  var zip_DEFAULT_LEVEL = 6;
  var zip_FULL_SEARCH = true;
  var zip_INBUFSIZ = 32768;
  var zip_INBUF_EXTRA = 64;
  var zip_OUTBUFSIZ = 1024 * 8;
  var zip_window_size = 2 * zip_WSIZE;
  var zip_MIN_MATCH = 3;
  var zip_MAX_MATCH = 258;
  var zip_BITS = 16;
  var zip_LIT_BUFSIZE = 0x2000;
  var zip_HASH_BITS = 13;
  var zip_DIST_BUFSIZE = zip_LIT_BUFSIZE;
  var zip_HASH_SIZE = 1 << zip_HASH_BITS;
  var zip_HASH_MASK = zip_HASH_SIZE - 1;
  var zip_WMASK = zip_WSIZE - 1;
  var zip_NIL = 0;
  var zip_TOO_FAR = 4096;
  var zip_MIN_LOOKAHEAD = zip_MAX_MATCH + zip_MIN_MATCH + 1;
  var zip_MAX_DIST = zip_WSIZE - zip_MIN_LOOKAHEAD;
  var zip_SMALLEST = 1;
  var zip_MAX_BITS = 15;
  var zip_MAX_BL_BITS = 7;
  var zip_LENGTH_CODES = 29;
  var zip_LITERALS = 256;
  var zip_END_BLOCK = 256;
  var zip_L_CODES = zip_LITERALS + 1 + zip_LENGTH_CODES;
  var zip_D_CODES = 30;
  var zip_BL_CODES = 19;
  var zip_REP_3_6 = 16;
  var zip_REPZ_3_10 = 17;
  var zip_REPZ_11_138 = 18;
  var zip_HEAP_SIZE = 2 * zip_L_CODES + 1;
  var zip_H_SHIFT = parseInt(
    (zip_HASH_BITS + zip_MIN_MATCH - 1) / zip_MIN_MATCH,
  );
  var zip_free_queue;
  var zip_qhead, zip_qtail;
  var zip_initflag;
  var zip_outbuf = null;
  var zip_outcnt, zip_outoff;
  var zip_complete;
  var zip_window;
  var zip_d_buf;
  var zip_l_buf;
  var zip_prev;
  var zip_bi_buf;
  var zip_bi_valid;
  var zip_block_start;
  var zip_ins_h;
  var zip_hash_head;
  var zip_prev_match;
  var zip_match_available;
  var zip_match_length;
  var zip_prev_length;
  var zip_strstart;
  var zip_match_start;
  var zip_eofile;
  var zip_lookahead;
  var zip_max_chain_length;
  var zip_max_lazy_match;
  var zip_compr_level;
  var zip_good_match;
  var zip_nice_match;
  var zip_dyn_ltree;
  var zip_dyn_dtree;
  var zip_static_ltree;
  var zip_static_dtree;
  var zip_bl_tree;
  var zip_l_desc;
  var zip_d_desc;
  var zip_bl_desc;
  var zip_bl_count;
  var zip_heap;
  var zip_heap_len;
  var zip_heap_max;
  var zip_depth;
  var zip_length_code;
  var zip_dist_code;
  var zip_base_length;
  var zip_base_dist;
  var zip_flag_buf;
  var zip_last_lit;
  var zip_last_dist;
  var zip_last_flags;
  var zip_flags;
  var zip_flag_bit;
  var zip_opt_len;
  var zip_static_len;
  var zip_deflate_data;
  var zip_deflate_pos;
  function zip_DeflateCT() {
    this.fc = 0;
    this.dl = 0;
  }
  function zip_DeflateTreeDesc() {
    this.dyn_tree = null;
    this.static_tree = null;
    this.extra_bits = null;
    this.extra_base = 0;
    this.elems = 0;
    this.max_length = 0;
    this.max_code = 0;
  }
  function zip_DeflateConfiguration(a, b, c, d) {
    this.good_length = a;
    this.max_lazy = b;
    this.nice_length = c;
    this.max_chain = d;
  }
  function zip_DeflateBuffer() {
    this.next = null;
    this.len = 0;
    this.ptr = [zip_OUTBUFSIZ];
    this.off = 0;
  }
  var zip_extra_lbits = [
    0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5,
    5, 5, 5, 0,
  ];
  var zip_extra_dbits = [
    0, 0, 0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10,
    11, 11, 12, 12, 13, 13,
  ];
  var zip_extra_blbits = [
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 3, 7,
  ];
  var zip_bl_order = [
    16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15,
  ];
  var zip_configuration_table = [
    new zip_DeflateConfiguration(0, 0, 0, 0),
    new zip_DeflateConfiguration(4, 4, 8, 4),
    new zip_DeflateConfiguration(4, 5, 16, 8),
    new zip_DeflateConfiguration(4, 6, 32, 32),
    new zip_DeflateConfiguration(4, 4, 16, 16),
    new zip_DeflateConfiguration(8, 16, 32, 32),
    new zip_DeflateConfiguration(8, 16, 128, 128),
    new zip_DeflateConfiguration(8, 32, 128, 256),
    new zip_DeflateConfiguration(32, 128, 258, 1024),
    new zip_DeflateConfiguration(32, 258, 258, 4096),
  ];
  function zip_deflate_start(level) {
    var i;
    if (!level) {
      level = zip_DEFAULT_LEVEL;
    } else if (level < 1) {
      level = 1;
    } else if (level > 9) {
      level = 9;
    }
    zip_compr_level = level;
    zip_initflag = false;
    zip_eofile = false;
    if (zip_outbuf != null) {
      return;
    }
    zip_free_queue = zip_qhead = zip_qtail = null;
    zip_outbuf = [zip_OUTBUFSIZ];
    zip_window = [zip_window_size];
    zip_d_buf = [zip_DIST_BUFSIZE];
    zip_l_buf = [zip_INBUFSIZ + zip_INBUF_EXTRA];
    zip_prev = [1 << zip_BITS];
    zip_dyn_ltree = [zip_HEAP_SIZE];
    for (i = 0; i < zip_HEAP_SIZE; i += 1) {
      zip_dyn_ltree[i] = new zip_DeflateCT();
    }
    zip_dyn_dtree = [2 * zip_D_CODES + 1];
    for (i = 0; i < 2 * zip_D_CODES + 1; i += 1) {
      zip_dyn_dtree[i] = new zip_DeflateCT();
    }
    zip_static_ltree = [zip_L_CODES + 2];
    for (i = 0; i < zip_L_CODES + 2; i += 1) {
      zip_static_ltree[i] = new zip_DeflateCT();
    }
    zip_static_dtree = [zip_D_CODES];
    for (i = 0; i < zip_D_CODES; i += 1) {
      zip_static_dtree[i] = new zip_DeflateCT();
    }
    zip_bl_tree = [2 * zip_BL_CODES + 1];
    for (i = 0; i < 2 * zip_BL_CODES + 1; i += 1) {
      zip_bl_tree[i] = new zip_DeflateCT();
    }
    zip_l_desc = new zip_DeflateTreeDesc();
    zip_d_desc = new zip_DeflateTreeDesc();
    zip_bl_desc = new zip_DeflateTreeDesc();
    zip_bl_count = [zip_MAX_BITS + 1];
    zip_heap = [2 * zip_L_CODES + 1];
    zip_depth = [2 * zip_L_CODES + 1];
    zip_length_code = [zip_MAX_MATCH - zip_MIN_MATCH + 1];
    zip_dist_code = [512];
    zip_base_length = [zip_LENGTH_CODES];
    zip_base_dist = [zip_D_CODES];
    zip_flag_buf = [parseInt(zip_LIT_BUFSIZE / 8)];
  }
  function zip_deflate_end() {
    zip_free_queue = zip_qhead = zip_qtail = null;
    zip_outbuf = null;
    zip_window = null;
    zip_d_buf = null;
    zip_l_buf = null;
    zip_prev = null;
    zip_dyn_ltree = null;
    zip_dyn_dtree = null;
    zip_static_ltree = null;
    zip_static_dtree = null;
    zip_bl_tree = null;
    zip_l_desc = null;
    zip_d_desc = null;
    zip_bl_desc = null;
    zip_bl_count = null;
    zip_heap = null;
    zip_depth = null;
    zip_length_code = null;
    zip_dist_code = null;
    zip_base_length = null;
    zip_base_dist = null;
    zip_flag_buf = null;
  }
  function zip_reuse_queue(p) {
    p.next = zip_free_queue;
    zip_free_queue = p;
  }
  function zip_new_queue() {
    var p;
    if (zip_free_queue != null) {
      p = zip_free_queue;
      zip_free_queue = zip_free_queue.next;
    } else {
      p = new zip_DeflateBuffer();
    }
    p.next = null;
    p.len = p.off = 0;
    return p;
  }
  function zip_head1(i) {
    return zip_prev[zip_WSIZE + i];
  }
  function zip_head2(i, val) {
    return (zip_prev[zip_WSIZE + i] = val);
  }
  function zip_put_byte(c) {
    zip_outbuf[zip_outoff + zip_outcnt++] = c;
    if (zip_outoff + zip_outcnt == zip_OUTBUFSIZ) {
      zip_qoutbuf();
    }
  }
  function zip_put_short(w) {
    w &= 0xffff;
    if (zip_outoff + zip_outcnt < zip_OUTBUFSIZ - 2) {
      zip_outbuf[zip_outoff + zip_outcnt++] = w & 0xff;
      zip_outbuf[zip_outoff + zip_outcnt++] = w >>> 8;
    } else {
      zip_put_byte(w & 0xff);
      zip_put_byte(w >>> 8);
    }
  }
  function zip_INSERT_STRING() {
    zip_ins_h =
      ((zip_ins_h << zip_H_SHIFT) ^
        (zip_window[zip_strstart + zip_MIN_MATCH - 1] & 0xff)) &
      zip_HASH_MASK;
    zip_hash_head = zip_head1(zip_ins_h);
    zip_prev[zip_strstart & zip_WMASK] = zip_hash_head;
    zip_head2(zip_ins_h, zip_strstart);
  }
  function zip_SEND_CODE(c, tree) {
    zip_send_bits(tree[c].fc, tree[c].dl);
  }
  function zip_D_CODE(dist) {
    return (
      (dist < 256 ? zip_dist_code[dist] : zip_dist_code[256 + (dist >> 7)]) &
      0xff
    );
  }
  function zip_SMALLER(tree, n, m) {
    return (
      tree[n].fc < tree[m].fc ||
      (tree[n].fc == tree[m].fc && zip_depth[n] <= zip_depth[m])
    );
  }
  function zip_read_buff(buff, offset, n) {
    var i;
    for (i = 0; i < n && zip_deflate_pos < zip_deflate_data.length; i += 1) {
      buff[offset + i] = zip_deflate_data.charCodeAt(zip_deflate_pos++) & 0xff;
    }
    return i;
  }
  function zip_lm_init() {
    var j;
    for (j = 0; j < zip_HASH_SIZE; j += 1) {
      zip_prev[zip_WSIZE + j] = 0;
    }
    zip_max_lazy_match = zip_configuration_table[zip_compr_level].max_lazy;
    zip_good_match = zip_configuration_table[zip_compr_level].good_length;
    if (!zip_FULL_SEARCH) {
      zip_nice_match = zip_configuration_table[zip_compr_level].nice_length;
    }
    zip_max_chain_length = zip_configuration_table[zip_compr_level].max_chain;
    zip_strstart = 0;
    zip_block_start = 0;
    zip_lookahead = zip_read_buff(zip_window, 0, 2 * zip_WSIZE);
    if (zip_lookahead <= 0) {
      zip_eofile = true;
      zip_lookahead = 0;
      return;
    }
    zip_eofile = false;
    while (zip_lookahead < zip_MIN_LOOKAHEAD && !zip_eofile) {
      zip_fill_window();
    }
    zip_ins_h = 0;
    for (j = 0; j < zip_MIN_MATCH - 1; j += 1) {
      zip_ins_h =
        ((zip_ins_h << zip_H_SHIFT) ^ (zip_window[j] & 0xff)) & zip_HASH_MASK;
    }
  }
  function zip_longest_match(cur_match) {
    var chain_length = zip_max_chain_length;
    var scanp = zip_strstart;
    var matchp;
    var len;
    var best_len = zip_prev_length;
    var limit =
      zip_strstart > zip_MAX_DIST ? zip_strstart - zip_MAX_DIST : zip_NIL;
    var strendp = zip_strstart + zip_MAX_MATCH;
    var scan_end1 = zip_window[scanp + best_len - 1];
    var scan_end = zip_window[scanp + best_len];
    if (zip_prev_length >= zip_good_match) {
      chain_length >>= 2;
    }
    do {
      matchp = cur_match;
      if (
        zip_window[matchp + best_len] != scan_end ||
        zip_window[matchp + best_len - 1] != scan_end1 ||
        zip_window[matchp] != zip_window[scanp] ||
        zip_window[(matchp += 1)] != zip_window[scanp + 1]
      ) {
        continue;
      }
      scanp += 2;
      matchp += 1;
      do {} while (
        zip_window[(scanp += 1)] == zip_window[(matchp += 1)] &&
        zip_window[(scanp += 1)] == zip_window[(matchp += 1)] &&
        zip_window[(scanp += 1)] == zip_window[(matchp += 1)] &&
        zip_window[(scanp += 1)] == zip_window[(matchp += 1)] &&
        zip_window[(scanp += 1)] == zip_window[(matchp += 1)] &&
        zip_window[(scanp += 1)] == zip_window[(matchp += 1)] &&
        zip_window[(scanp += 1)] == zip_window[(matchp += 1)] &&
        zip_window[(scanp += 1)] == zip_window[(matchp += 1)] &&
        scanp < strendp
      );
      len = zip_MAX_MATCH - (strendp - scanp);
      scanp = strendp - zip_MAX_MATCH;
      if (len > best_len) {
        zip_match_start = cur_match;
        best_len = len;
        if (zip_FULL_SEARCH) {
          if (len >= zip_MAX_MATCH) {
            break;
          }
        } else {
          if (len >= zip_nice_match) {
            break;
          }
        }
        scan_end1 = zip_window[scanp + best_len - 1];
        scan_end = zip_window[scanp + best_len];
      }
    } while (
      (cur_match = zip_prev[cur_match & zip_WMASK]) > limit &&
      --chain_length != 0
    );
    return best_len;
  }
  function zip_fill_window() {
    var n, m;
    var more = zip_window_size - zip_lookahead - zip_strstart;
    if (more == -1) {
      more -= 1;
    } else if (zip_strstart >= zip_WSIZE + zip_MAX_DIST) {
      for (n = 0; n < zip_WSIZE; n += 1) {
        zip_window[n] = zip_window[n + zip_WSIZE];
      }
      zip_match_start -= zip_WSIZE;
      zip_strstart -= zip_WSIZE;
      zip_block_start -= zip_WSIZE;
      for (n = 0; n < zip_HASH_SIZE; n += 1) {
        m = zip_head1(n);
        zip_head2(n, m >= zip_WSIZE ? m - zip_WSIZE : zip_NIL);
      }
      for (n = 0; n < zip_WSIZE; n += 1) {
        m = zip_prev[n];
        zip_prev[n] = m >= zip_WSIZE ? m - zip_WSIZE : zip_NIL;
      }
      more += zip_WSIZE;
    }
    if (!zip_eofile) {
      n = zip_read_buff(zip_window, zip_strstart + zip_lookahead, more);
      if (n <= 0) {
        zip_eofile = true;
      } else {
        zip_lookahead += n;
      }
    }
  }
  function zip_deflate_fast() {
    while (zip_lookahead != 0 && zip_qhead == null) {
      var flush;
      zip_INSERT_STRING();
      if (
        zip_hash_head != zip_NIL &&
        zip_strstart - zip_hash_head <= zip_MAX_DIST
      ) {
        zip_match_length = zip_longest_match(zip_hash_head);
        if (zip_match_length > zip_lookahead) {
          zip_match_length = zip_lookahead;
        }
      }
      if (zip_match_length >= zip_MIN_MATCH) {
        flush = zip_ct_tally(
          zip_strstart - zip_match_start,
          zip_match_length - zip_MIN_MATCH,
        );
        zip_lookahead -= zip_match_length;
        if (zip_match_length <= zip_max_lazy_match) {
          zip_match_length -= 1;
          do {
            zip_strstart += 1;
            zip_INSERT_STRING();
          } while (--zip_match_length != 0);
          zip_strstart += 1;
        } else {
          zip_strstart += zip_match_length;
          zip_match_length = 0;
          zip_ins_h = zip_window[zip_strstart] & 0xff;
          zip_ins_h =
            ((zip_ins_h << zip_H_SHIFT) ^
              (zip_window[zip_strstart + 1] & 0xff)) &
            zip_HASH_MASK;
        }
      } else {
        flush = zip_ct_tally(0, zip_window[zip_strstart] & 0xff);
        zip_lookahead -= 1;
        zip_strstart += 1;
      }
      if (flush) {
        zip_flush_block(0);
        zip_block_start = zip_strstart;
      }
      while (zip_lookahead < zip_MIN_LOOKAHEAD && !zip_eofile) {
        zip_fill_window();
      }
    }
  }
  function zip_deflate_better() {
    while (zip_lookahead != 0 && zip_qhead == null) {
      zip_INSERT_STRING();
      zip_prev_length = zip_match_length;
      zip_prev_match = zip_match_start;
      zip_match_length = zip_MIN_MATCH - 1;
      if (
        zip_hash_head != zip_NIL &&
        zip_prev_length < zip_max_lazy_match &&
        zip_strstart - zip_hash_head <= zip_MAX_DIST
      ) {
        zip_match_length = zip_longest_match(zip_hash_head);
        if (zip_match_length > zip_lookahead) {
          zip_match_length = zip_lookahead;
        }
        if (
          zip_match_length == zip_MIN_MATCH &&
          zip_strstart - zip_match_start > zip_TOO_FAR
        ) {
          zip_match_length -= 1;
        }
      }
      if (
        zip_prev_length >= zip_MIN_MATCH &&
        zip_match_length <= zip_prev_length
      ) {
        var flush;
        flush = zip_ct_tally(
          zip_strstart - 1 - zip_prev_match,
          zip_prev_length - zip_MIN_MATCH,
        );
        zip_lookahead -= zip_prev_length - 1;
        zip_prev_length -= 2;
        do {
          zip_strstart += 1;
          zip_INSERT_STRING();
        } while (--zip_prev_length != 0);
        zip_match_available = 0;
        zip_match_length = zip_MIN_MATCH - 1;
        zip_strstart += 1;
        if (flush) {
          zip_flush_block(0);
          zip_block_start = zip_strstart;
        }
      } else if (zip_match_available != 0) {
        if (zip_ct_tally(0, zip_window[zip_strstart - 1] & 0xff)) {
          zip_flush_block(0);
          zip_block_start = zip_strstart;
        }
        zip_strstart += 1;
        zip_lookahead -= 1;
      } else {
        zip_match_available = 1;
        zip_strstart += 1;
        zip_lookahead -= 1;
      }
      while (zip_lookahead < zip_MIN_LOOKAHEAD && !zip_eofile) {
        zip_fill_window();
      }
    }
  }
  function zip_init_deflate() {
    if (zip_eofile) {
      return;
    }
    zip_bi_buf = 0;
    zip_bi_valid = 0;
    zip_ct_init();
    zip_lm_init();
    zip_qhead = null;
    zip_outcnt = 0;
    zip_outoff = 0;
    if (zip_compr_level <= 3) {
      zip_prev_length = zip_MIN_MATCH - 1;
      zip_match_length = 0;
    } else {
      zip_match_length = zip_MIN_MATCH - 1;
      zip_match_available = 0;
    }
    zip_complete = false;
  }
  function zip_deflate_internal(buff, off, buff_size) {
    var n;
    if (!zip_initflag) {
      zip_init_deflate();
      zip_initflag = true;
      if (zip_lookahead == 0) {
        zip_complete = true;
        return 0;
      }
    }
    if ((n = zip_qcopy(buff, off, buff_size)) == buff_size) {
      return buff_size;
    }
    if (zip_complete) {
      return n;
    }
    if (zip_compr_level <= 3) {
      zip_deflate_fast();
    } else {
      zip_deflate_better();
    }
    if (zip_lookahead == 0) {
      if (zip_match_available != 0) {
        zip_ct_tally(0, zip_window[zip_strstart - 1] & 0xff);
      }
      zip_flush_block(1);
      zip_complete = true;
    }
    return n + zip_qcopy(buff, n + off, buff_size - n);
  }
  function zip_qcopy(buff, off, buff_size) {
    var n, i, j;
    n = 0;
    while (zip_qhead != null && n < buff_size) {
      i = buff_size - n;
      if (i > zip_qhead.len) {
        i = zip_qhead.len;
      }
      for (j = 0; j < i; j += 1) {
        buff[off + n + j] = zip_qhead.ptr[zip_qhead.off + j];
      }
      zip_qhead.off += i;
      zip_qhead.len -= i;
      n += i;
      if (zip_qhead.len == 0) {
        var p;
        p = zip_qhead;
        zip_qhead = zip_qhead.next;
        zip_reuse_queue(p);
      }
    }
    if (n == buff_size) {
      return n;
    }
    if (zip_outoff < zip_outcnt) {
      i = buff_size - n;
      if (i > zip_outcnt - zip_outoff) {
        i = zip_outcnt - zip_outoff;
      }
      for (j = 0; j < i; j += 1) {
        buff[off + n + j] = zip_outbuf[zip_outoff + j];
      }
      zip_outoff += i;
      n += i;
      if (zip_outcnt == zip_outoff) {
        zip_outcnt = zip_outoff = 0;
      }
    }
    return n;
  }
  function zip_ct_init() {
    var n;
    var bits;
    var length;
    var code;
    var dist;
    if (zip_static_dtree[0].dl != 0) {
      return;
    }
    zip_l_desc.dyn_tree = zip_dyn_ltree;
    zip_l_desc.static_tree = zip_static_ltree;
    zip_l_desc.extra_bits = zip_extra_lbits;
    zip_l_desc.extra_base = zip_LITERALS + 1;
    zip_l_desc.elems = zip_L_CODES;
    zip_l_desc.max_length = zip_MAX_BITS;
    zip_l_desc.max_code = 0;
    zip_d_desc.dyn_tree = zip_dyn_dtree;
    zip_d_desc.static_tree = zip_static_dtree;
    zip_d_desc.extra_bits = zip_extra_dbits;
    zip_d_desc.extra_base = 0;
    zip_d_desc.elems = zip_D_CODES;
    zip_d_desc.max_length = zip_MAX_BITS;
    zip_d_desc.max_code = 0;
    zip_bl_desc.dyn_tree = zip_bl_tree;
    zip_bl_desc.static_tree = null;
    zip_bl_desc.extra_bits = zip_extra_blbits;
    zip_bl_desc.extra_base = 0;
    zip_bl_desc.elems = zip_BL_CODES;
    zip_bl_desc.max_length = zip_MAX_BL_BITS;
    zip_bl_desc.max_code = 0;
    length = 0;
    for (code = 0; code < zip_LENGTH_CODES - 1; code += 1) {
      zip_base_length[code] = length;
      for (n = 0; n < 1 << zip_extra_lbits[code]; n += 1) {
        zip_length_code[length++] = code;
      }
    }
    zip_length_code[length - 1] = code;
    dist = 0;
    for (code = 0; code < 16; code += 1) {
      zip_base_dist[code] = dist;
      for (n = 0; n < 1 << zip_extra_dbits[code]; n += 1) {
        zip_dist_code[dist++] = code;
      }
    }
    dist >>= 7;
    for (; code < zip_D_CODES; code += 1) {
      zip_base_dist[code] = dist << 7;
      for (n = 0; n < 1 << (zip_extra_dbits[code] - 7); n += 1) {
        zip_dist_code[256 + dist++] = code;
      }
    }
    for (bits = 0; bits <= zip_MAX_BITS; bits += 1) {
      zip_bl_count[bits] = 0;
    }
    n = 0;
    while (n <= 143) {
      zip_static_ltree[n++].dl = 8;
      zip_bl_count[8] += 1;
    }
    while (n <= 255) {
      zip_static_ltree[n++].dl = 9;
      zip_bl_count[9] += 1;
    }
    while (n <= 279) {
      zip_static_ltree[n++].dl = 7;
      zip_bl_count[7] += 1;
    }
    while (n <= 287) {
      zip_static_ltree[n++].dl = 8;
      zip_bl_count[8] += 1;
    }
    zip_gen_codes(zip_static_ltree, zip_L_CODES + 1);
    for (n = 0; n < zip_D_CODES; n += 1) {
      zip_static_dtree[n].dl = 5;
      zip_static_dtree[n].fc = zip_bi_reverse(n, 5);
    }
    zip_init_block();
  }
  function zip_init_block() {
    var n;
    for (n = 0; n < zip_L_CODES; n += 1) {
      zip_dyn_ltree[n].fc = 0;
    }
    for (n = 0; n < zip_D_CODES; n += 1) {
      zip_dyn_dtree[n].fc = 0;
    }
    for (n = 0; n < zip_BL_CODES; n += 1) {
      zip_bl_tree[n].fc = 0;
    }
    zip_dyn_ltree[zip_END_BLOCK].fc = 1;
    zip_opt_len = zip_static_len = 0;
    zip_last_lit = zip_last_dist = zip_last_flags = 0;
    zip_flags = 0;
    zip_flag_bit = 1;
  }
  function zip_pqdownheap(tree, k) {
    var v = zip_heap[k];
    var j = k << 1;
    while (j <= zip_heap_len) {
      if (j < zip_heap_len && zip_SMALLER(tree, zip_heap[j + 1], zip_heap[j])) {
        j += 1;
      }
      if (zip_SMALLER(tree, v, zip_heap[j])) {
        break;
      }
      zip_heap[k] = zip_heap[j];
      k = j;
      j <<= 1;
    }
    zip_heap[k] = v;
  }
  function zip_gen_bitlen(desc) {
    var tree = desc.dyn_tree;
    var extra = desc.extra_bits;
    var base = desc.extra_base;
    var max_code = desc.max_code;
    var max_length = desc.max_length;
    var stree = desc.static_tree;
    var h;
    var n, m;
    var bits;
    var xbits;
    var f;
    var overflow = 0;
    for (bits = 0; bits <= zip_MAX_BITS; bits += 1) {
      zip_bl_count[bits] = 0;
    }
    tree[zip_heap[zip_heap_max]].dl = 0;
    for (h = zip_heap_max + 1; h < zip_HEAP_SIZE; h += 1) {
      n = zip_heap[h];
      bits = tree[tree[n].dl].dl + 1;
      if (bits > max_length) {
        bits = max_length;
        overflow += 1;
      }
      tree[n].dl = bits;
      if (n > max_code) {
        continue;
      }
      zip_bl_count[bits] += 1;
      xbits = 0;
      if (n >= base) {
        xbits = extra[n - base];
      }
      f = tree[n].fc;
      zip_opt_len += f * (bits + xbits);
      if (stree != null) {
        zip_static_len += f * (stree[n].dl + xbits);
      }
    }
    if (overflow == 0) {
      return;
    }
    do {
      bits = max_length - 1;
      while (zip_bl_count[bits] == 0) bits -= 1;
      zip_bl_count[bits] -= 1;
      zip_bl_count[bits + 1] += 2;
      zip_bl_count[max_length] -= 1;
      overflow -= 2;
    } while (overflow > 0);
    for (bits = max_length; bits != 0; bits -= 1) {
      n = zip_bl_count[bits];
      while (n != 0) {
        m = zip_heap[(h -= 1)];
        if (m > max_code) {
          continue;
        }
        if (tree[m].dl != bits) {
          zip_opt_len += (bits - tree[m].dl) * tree[m].fc;
          tree[m].fc = bits;
        }
        n -= 1;
      }
    }
  }
  function zip_gen_codes(tree, max_code) {
    var next_code = [zip_MAX_BITS + 1];
    var code = 0;
    var bits;
    var n;
    for (bits = 1; bits <= zip_MAX_BITS; bits += 1) {
      code = (code + zip_bl_count[bits - 1]) << 1;
      next_code[bits] = code;
    }
    for (n = 0; n <= max_code; n += 1) {
      var len = tree[n].dl;
      if (len == 0) {
        continue;
      }
      tree[n].fc = zip_bi_reverse(next_code[len]++, len);
    }
  }
  function zip_build_tree(desc) {
    var tree = desc.dyn_tree;
    var stree = desc.static_tree;
    var elems = desc.elems;
    var n, m;
    var max_code = -1;
    var node = elems;
    zip_heap_len = 0;
    zip_heap_max = zip_HEAP_SIZE;
    for (n = 0; n < elems; n += 1) {
      if (tree[n].fc != 0) {
        zip_heap[(zip_heap_len += 1)] = max_code = n;
        zip_depth[n] = 0;
      } else {
        tree[n].dl = 0;
      }
    }
    while (zip_heap_len < 2) {
      var xnew = (zip_heap[(zip_heap_len += 1)] =
        max_code < 2 ? ++max_code : 0);
      tree[xnew].fc = 1;
      zip_depth[xnew] = 0;
      zip_opt_len -= 1;
      if (stree != null) {
        zip_static_len -= stree[xnew].dl;
      }
    }
    desc.max_code = max_code;
    for (n = zip_heap_len >> 1; n >= 1; n -= 1) {
      zip_pqdownheap(tree, n);
    }
    do {
      n = zip_heap[zip_SMALLEST];
      zip_heap[zip_SMALLEST] = zip_heap[zip_heap_len--];
      zip_pqdownheap(tree, zip_SMALLEST);
      m = zip_heap[zip_SMALLEST];
      zip_heap[(zip_heap_max -= 1)] = n;
      zip_heap[(zip_heap_max -= 1)] = m;
      tree[node].fc = tree[n].fc + tree[m].fc;
      if (zip_depth[n] > zip_depth[m] + 1) {
        zip_depth[node] = zip_depth[n];
      } else {
        zip_depth[node] = zip_depth[m] + 1;
      }
      tree[n].dl = tree[m].dl = node;
      zip_heap[zip_SMALLEST] = node++;
      zip_pqdownheap(tree, zip_SMALLEST);
    } while (zip_heap_len >= 2);
    zip_heap[(zip_heap_max -= 1)] = zip_heap[zip_SMALLEST];
    zip_gen_bitlen(desc);
    zip_gen_codes(tree, max_code);
  }
  function zip_scan_tree(tree, max_code) {
    var n;
    var prevlen = -1;
    var curlen;
    var nextlen = tree[0].dl;
    var count = 0;
    var max_count = 7;
    var min_count = 4;
    if (nextlen == 0) {
      max_count = 138;
      min_count = 3;
    }
    tree[max_code + 1].dl = 0xffff;
    for (n = 0; n <= max_code; n += 1) {
      curlen = nextlen;
      nextlen = tree[n + 1].dl;
      if (++count < max_count && curlen == nextlen) {
        continue;
      } else if (count < min_count) {
        zip_bl_tree[curlen].fc += count;
      } else if (curlen != 0) {
        if (curlen != prevlen) {
          zip_bl_tree[curlen].fc += 1;
        }
        zip_bl_tree[zip_REP_3_6].fc += 1;
      } else if (count <= 10) {
        zip_bl_tree[zip_REPZ_3_10].fc += 1;
      } else {
        zip_bl_tree[zip_REPZ_11_138].fc += 1;
      }
      count = 0;
      prevlen = curlen;
      if (nextlen == 0) {
        max_count = 138;
        min_count = 3;
      } else if (curlen == nextlen) {
        max_count = 6;
        min_count = 3;
      } else {
        max_count = 7;
        min_count = 4;
      }
    }
  }
  function zip_send_tree(tree, max_code) {
    var n;
    var prevlen = -1;
    var curlen;
    var nextlen = tree[0].dl;
    var count = 0;
    var max_count = 7;
    var min_count = 4;
    if (nextlen == 0) {
      max_count = 138;
      min_count = 3;
    }
    for (n = 0; n <= max_code; n += 1) {
      curlen = nextlen;
      nextlen = tree[n + 1].dl;
      if (++count < max_count && curlen == nextlen) {
        continue;
      } else if (count < min_count) {
        do {
          zip_SEND_CODE(curlen, zip_bl_tree);
        } while (--count != 0);
      } else if (curlen != 0) {
        if (curlen != prevlen) {
          zip_SEND_CODE(curlen, zip_bl_tree);
          count -= 1;
        }
        zip_SEND_CODE(zip_REP_3_6, zip_bl_tree);
        zip_send_bits(count - 3, 2);
      } else if (count <= 10) {
        zip_SEND_CODE(zip_REPZ_3_10, zip_bl_tree);
        zip_send_bits(count - 3, 3);
      } else {
        zip_SEND_CODE(zip_REPZ_11_138, zip_bl_tree);
        zip_send_bits(count - 11, 7);
      }
      count = 0;
      prevlen = curlen;
      if (nextlen == 0) {
        max_count = 138;
        min_count = 3;
      } else if (curlen == nextlen) {
        max_count = 6;
        min_count = 3;
      } else {
        max_count = 7;
        min_count = 4;
      }
    }
  }
  function zip_build_bl_tree() {
    var max_blindex;
    zip_scan_tree(zip_dyn_ltree, zip_l_desc.max_code);
    zip_scan_tree(zip_dyn_dtree, zip_d_desc.max_code);
    zip_build_tree(zip_bl_desc);
    for (max_blindex = zip_BL_CODES - 1; max_blindex >= 3; max_blindex -= 1) {
      if (zip_bl_tree[zip_bl_order[max_blindex]].dl != 0) {
        break;
      }
    }
    zip_opt_len += 3 * (max_blindex + 1) + 5 + 5 + 4;
    return max_blindex;
  }
  function zip_send_all_trees(lcodes, dcodes, blcodes) {
    var rank;
    zip_send_bits(lcodes - 257, 5);
    zip_send_bits(dcodes - 1, 5);
    zip_send_bits(blcodes - 4, 4);
    for (rank = 0; rank < blcodes; rank += 1) {
      zip_send_bits(zip_bl_tree[zip_bl_order[rank]].dl, 3);
    }
    zip_send_tree(zip_dyn_ltree, lcodes - 1);
    zip_send_tree(zip_dyn_dtree, dcodes - 1);
  }
  function zip_flush_block(eof) {
    var opt_lenb, static_lenb;
    var max_blindex;
    var stored_len;
    stored_len = zip_strstart - zip_block_start;
    zip_flag_buf[zip_last_flags] = zip_flags;
    zip_build_tree(zip_l_desc);
    zip_build_tree(zip_d_desc);
    max_blindex = zip_build_bl_tree();
    opt_lenb = (zip_opt_len + 3 + 7) >> 3;
    static_lenb = (zip_static_len + 3 + 7) >> 3;
    if (static_lenb <= opt_lenb) {
      opt_lenb = static_lenb;
    }
    if (stored_len + 4 <= opt_lenb && zip_block_start >= 0) {
      var i;
      zip_send_bits((zip_STORED_BLOCK << 1) + eof, 3);
      zip_bi_windup();
      zip_put_short(stored_len);
      zip_put_short(~stored_len);
      for (i = 0; i < stored_len; i += 1) {
        zip_put_byte(zip_window[zip_block_start + i]);
      }
    } else if (static_lenb == opt_lenb) {
      zip_send_bits((zip_STATIC_TREES << 1) + eof, 3);
      zip_compress_block(zip_static_ltree, zip_static_dtree);
    } else {
      zip_send_bits((zip_DYN_TREES << 1) + eof, 3);
      zip_send_all_trees(
        zip_l_desc.max_code + 1,
        zip_d_desc.max_code + 1,
        max_blindex + 1,
      );
      zip_compress_block(zip_dyn_ltree, zip_dyn_dtree);
    }
    zip_init_block();
    if (eof != 0) {
      zip_bi_windup();
    }
  }
  function zip_ct_tally(dist, lc) {
    zip_l_buf[zip_last_lit++] = lc;
    if (dist == 0) {
      zip_dyn_ltree[lc].fc += 1;
    } else {
      dist -= 1;
      zip_dyn_ltree[zip_length_code[lc] + zip_LITERALS + 1].fc += 1;
      zip_dyn_dtree[zip_D_CODE(dist)].fc += 1;
      zip_d_buf[zip_last_dist++] = dist;
      zip_flags |= zip_flag_bit;
    }
    zip_flag_bit <<= 1;
    if ((zip_last_lit & 7) == 0) {
      zip_flag_buf[zip_last_flags++] = zip_flags;
      zip_flags = 0;
      zip_flag_bit = 1;
    }
    if (zip_compr_level > 2 && (zip_last_lit & 0xfff) == 0) {
      var out_length = zip_last_lit * 8;
      var in_length = zip_strstart - zip_block_start;
      var dcode;
      for (dcode = 0; dcode < zip_D_CODES; dcode += 1) {
        out_length += zip_dyn_dtree[dcode].fc * (5 + zip_extra_dbits[dcode]);
      }
      out_length >>= 3;
      if (
        zip_last_dist < parseInt(zip_last_lit / 2) &&
        out_length < parseInt(in_length / 2)
      ) {
        return true;
      }
    }
    return (
      zip_last_lit == zip_LIT_BUFSIZE - 1 || zip_last_dist == zip_DIST_BUFSIZE
    );
  }
  function zip_compress_block(ltree, dtree) {
    var dist;
    var lc;
    var lx = 0;
    var dx = 0;
    var fx = 0;
    var flag = 0;
    var code;
    var extra;
    if (zip_last_lit != 0) {
      do {
        if ((lx & 7) == 0) {
          flag = zip_flag_buf[fx++];
        }
        lc = zip_l_buf[lx++] & 0xff;
        if ((flag & 1) == 0) {
          zip_SEND_CODE(lc, ltree);
        } else {
          code = zip_length_code[lc];
          zip_SEND_CODE(code + zip_LITERALS + 1, ltree);
          extra = zip_extra_lbits[code];
          if (extra != 0) {
            lc -= zip_base_length[code];
            zip_send_bits(lc, extra);
          }
          dist = zip_d_buf[dx++];
          code = zip_D_CODE(dist);
          zip_SEND_CODE(code, dtree);
          extra = zip_extra_dbits[code];
          if (extra != 0) {
            dist -= zip_base_dist[code];
            zip_send_bits(dist, extra);
          }
        }
        flag >>= 1;
      } while (lx < zip_last_lit);
    }
    zip_SEND_CODE(zip_END_BLOCK, ltree);
  }
  var zip_Buf_size = 16;
  function zip_send_bits(value, length) {
    if (zip_bi_valid > zip_Buf_size - length) {
      zip_bi_buf |= value << zip_bi_valid;
      zip_put_short(zip_bi_buf);
      zip_bi_buf = value >> (zip_Buf_size - zip_bi_valid);
      zip_bi_valid += length - zip_Buf_size;
    } else {
      zip_bi_buf |= value << zip_bi_valid;
      zip_bi_valid += length;
    }
  }
  function zip_bi_reverse(code, len) {
    var res = 0;
    do {
      res |= code & 1;
      code >>= 1;
      res <<= 1;
    } while (--len > 0);
    return res >> 1;
  }
  function zip_bi_windup() {
    if (zip_bi_valid > 8) {
      zip_put_short(zip_bi_buf);
    } else if (zip_bi_valid > 0) {
      zip_put_byte(zip_bi_buf);
    }
    zip_bi_buf = 0;
    zip_bi_valid = 0;
  }
  function zip_qoutbuf() {
    if (zip_outcnt != 0) {
      var q, i;
      q = zip_new_queue();
      if (zip_qhead == null) {
        zip_qhead = zip_qtail = q;
      } else {
        zip_qtail = zip_qtail.next = q;
      }
      q.len = zip_outcnt - zip_outoff;
      for (i = 0; i < q.len; i += 1) {
        q.ptr[i] = zip_outbuf[zip_outoff + i];
      }
      zip_outcnt = zip_outoff = 0;
    }
  }
  return function deflate(str, level) {
    var i, j;
    zip_deflate_data = str;
    zip_deflate_pos = 0;
    if (typeof level == "undefined") {
      level = zip_DEFAULT_LEVEL;
    }
    zip_deflate_start(level);
    var buff = [1024];
    var aout = [];
    while ((i = zip_deflate_internal(buff, 0, buff.length)) > 0) {
      var cbuf = [i];
      for (j = 0; j < i; j += 1) {
        cbuf[j] = String.fromCharCode(buff[j]);
      }
      aout[aout.length] = cbuf.join("");
    }
    zip_deflate_data = null;
    return aout.join("");
  };
})();
onmessage = function worker(m) {
  postMessage(deflate(m.data, 9));
};
onconnect = function sharedWorker(e) {
  var port = e.ports[0];
  port.onmessage = function (m) {
    port.postMessage(deflate(m.data, 9));
  };
};
