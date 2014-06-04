/*
 * The MIT License
 * 
 *  Copyright (c) 2010 Mike de Boer
 * 
 *  Permission is hereby granted, free of charge, to any person obtaining a copy
 *  of this software and associated documentation files (the "Software"), to deal
 *  in the Software without restriction, including without limitation the rights
 *  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 *  copies of the Software, and to permit persons to whom the Software is
 *  furnished to do so, subject to the following conditions:
 * 
 *  The above copyright notice and this permission notice shall be included in
 *  all copies or substantial portions of the Software.
 * 
 *  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 *  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 *  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 *  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 *  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 *  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 *  THE SOFTWARE.
 */

 /**
  * Trie is a kind of digital search tree. (See [Knuth1972] for more details
  * on digital search trees.)
  * [Fredkin1960] introduced the trie terminology, which is abbreviated from "Retrieval".
  * [Knuth1972] Knuth, D. E. The Art of Computer Programming Vol. 3, Sorting and Searching. Addison-Wesley. 1972.
  * [Fredkin1960] Fredkin, E. Trie Memory. Communication of the ACM. Vol. 3:9 (Sep 1960). pp. 490-499.
  * <a href="http://linux.thai.net/~thep/datrie/datrie.html">source</a>
  * @see <a href="http://en.wikipedia.org/wiki/Trie">Wikipedia article</a>
  * 
  * The trie implementation of Dennis Byrne served as a starting point and inspiration:
  * @link http://notdennisbyrne.blogspot.com/2008/12/javascript-trie-implementation.html
  * 
  * @param {String} stem    One character long representation of the trie node instance
  * @default ''
  * @param {Number} sorting Sort method. May be {@link SORT_ASC} or {@link SORT_DESC}.
  * @default SORT_DESC
  * @property {Number} SORT_ASC sort the trie in ascending lexical order
  * @property {Number} SORT_DESC sort the trie in descending lexical order
  * @property {Number} SORT_NONE  sort the trie in no particular order
  * @author Mike de Boer <mike AT ajax.org>
  * @constructor 
  */
var Trie = (function() {
    
    /** @ignore */
    function Trie(stem, sorting) {
        this.stem        = stem || "";
        this.nstem       = this.stem.charCodeAt(0);
        this.sorting     = sorting || Trie.SORT_DESC;
        this.wordCount   = 0;
        this.prefixCount = 0;
        this.children    = [];
    }

    Trie.SORT_ASC  = 0x0001;
    Trie.SORT_DESC = 0x0002;
    Trie.SORT_NONE = 0x0004;

    Trie.prototype = {
        /**
         * Add a word to the existing dictionary. If a trie node doesn't exist
         * yet, it is created with that character as its stem.
         * Since an add is already an expensive action, compared to adding nodes to
         * native Javascript containers like Array or Object, inserting a trie
         * node in lexical order is relatively cheap.
         * Please refer to the test suite to compare performance in your browser(s).
         *
         * @param {String} word Remainder of the word that is added to the root trie
         * @type  {void}
         */
        add: function(word) {
            if (word) {
                var t,
                    s = this.sorting,
                    i = 0,
                    k = word.charAt(0),
                    c = this.children,
                    l = c.length;
                // check if a child with stem 'k' already exists:
                for (; i < l; ++i) {
                    if (c[i].stem == k) {
                        t = c[i];
                        break;
                    }
                }
                if (!t) {
                    ++this.prefixCount;
                    t = new Trie(k, s);
                    if (!s || !c.length || s & Trie.SORT_NONE) {
                        c.push(t);
                    }
                    else if (s & Trie.SORT_DESC) {
                        i = l;
                        do {
                            if (--i < 0) {
                                c.unshift(t);
                                break;
                            }
                        } while (c[i].stem > k)
                        if (i >= 0)
                            c.splice(i + 1, 0, t);
                    }
                    else {
                        i = 0, --l;
                        do {
                            if (++i > l) {
                                c.unshift(t);
                                break;
                            }
                        } while (c[i].stem > k)
                        if (i <= l)
                            c.splice(i, 0, t);
                    }
                }
                t.add(word.substring(1));
            }
            else {
                ++this.wordCount;
            }
        },
        
        /**
         * Update a word in the dictionary. This update implementation is
         * implemented like a file rename action as on a filesystem: add a node
         * with the new name and remove the outdated, 'old' version.
         *
         * @param {String} sOld the old word to be replaced by the word provided
         *                      by 'sNew'
         * @param {String} sNew the new word to be added to the dictionary
         * @type  {void}
         */
        update: function(sOld, sNew) {
            this.remove(sOld);
            this.add(sNew);
        },
        
        /**
         * Remove a word from the dictionary. This function uses the
         * walker, which is a generic implementation of a tree walker.
         *
         * @param {String} word the word to remove
         * @type  {void}
         */
        remove: function(word) {
            walker(word, this, function(trie, idx) {
                trie.children.remove(idx);
            });
        },
        
        /**
         * Find a trie node that is paired with a word or prefix 's'. Like the
         * {@link remove} function, this function also uses the walker.
         *
         * @param {String}   prefix the word or prefix to search for in the dictionary
         * @type  {Trie}
         */
        find: function(prefix) {
            return walker(prefix, this, function(trie, idx) {
                return trie.children[idx];
            });
        },
        
        /**
         * @alias {find}
         *
         * @param {String} prefix the word or prefix to search for in the dictionary
         * @type  {Trie}
         */
        findPrefix: function(prefix) {
            // AFAIK, this is just an alias of find, because that returns a trie rootnode.
            // From that rootnode, it's easy to create a list of disambiguations.
            return this.find(prefix);
        },

        /**
         * Retrieve a direct child node of this dictionary with 'prefix'. 
         *
         * @param {String} prefix s the word or prefix to search for in the
         *                          children of this dictionary
         * @type  {Trie}
         */
        getChild: function(prefix) {
            var i = 0,
                c = this.children,
                l = c.length;
            for (; i < l; ++i) {
                if (c[i].stem == prefix)
                    return c[i];
            }

            return null;
        },
        
        /**
         * A version of {@link getChild} with a Boolean return type.
         *
         * @param {String} prefix s the word or prefix to search for in the
         *                          children of this dictionary
         * @type  {Boolean}
         */
        hasChild: function(prefix) {
            return this.getChild(prefix) !== null;
        },

        /**
         * Resort this dictionary in lexical order, either in an ascending or
         * descending direction.
         * Since it uses the native {@link Array#sort} method, sorting speed can
         * be considered linear O(n) to the size of the trie, i.e. the word count.
         * Please refer to the test suite to compare performance in your browser(s).
         *
         * @param {Number} direction sorting direction. Possible values:
         *                 {@link Trie#SORT_ASC}
         *                 {@link Trie#SORT_DESC}
         * @type  {void}
         */
        sort: function(direction) {
            if (typeof direction == "undefined")
                direction = Trie.SORT_DESC;
            if (!this.prefixCount || this.sorting === direction) return;
            this.sorting = direction;
            if (direction & Trie.SORT_NONE) return;
            var c = this.children,
                i = c.length - 1,
                m = direction & Trie.SORT_ASC ? sortAsc : sortDesc;
            c.sort(m);
            for (; i >= 0; --i)
                c[i].sort(direction);
        },

        /**
         * Retrieve the Array of words that originate from this trie.
         * The main use-case for this function is for implementations of the 
         * type-ahead user experience pattern, but can be used to other ends as
         * well, of course.
         * The performance of this function still needs to be profiled against
         * alternatives, like pre-caching the words Array per Trie when it's
         * instantiated.
         * 
         * @param {String} [s] prefix to prepend to a stem character to make it
         *                     a word
         * @type  {Array}
         */
        getWords: function(s) {
            s = s || this.stem;
            var words = [],
                c     = this.children,
                i     = 0,
                l     = c.length;
            for (; i < l; ++i) {
                if (c[i].wordCount)
                    words.push(s + c[i].stem);
                words = words.concat(c[i].getWords(s + c[i].stem));
            }
            return words;
        },

        /**
         * Retrieve the prefix count of the applied argument
         *
         * @param {String} word the prefix or word-completing stem
         * @type  {Number}
         */
        getPrefixCount: function(word){
            return walker(word, this, function(trie, idx) {
                return trie.children[idx].prefixCount;
            }) || 0;
        },

        /**
         * Retrieve the word count of the applied argument
         *
         * @param {String} word the prefix or word-completing stem
         * @type  {Number}
         */
        getWordCount: function(word){
            return walker(word, this, function(trie, idx) {
                return trie.children[idx].wordCount;
            }) || 0;
        },
        
        /**
         * Overrides Object.prototype.toString to deliver a more context sensitive
         * String representation of a Trie.
         *
         * @type {String}
         */
        toString: function() {
            return "[Trie] '" + this.stem + "': {\n"
                 + "    stem: " + this.stem + ",\n"
                 + "    prefixCount: " + this.prefixCount + ",\n"
                 + "    wordCount: " + this.wordCount + ",\n"
                 + "    children: [Array]{" + this.children.length + "}\n"
                 + "}";
        }
    };
    
    /**
     * NOT named after Johnny, but merely after the verb 'to walk'.
     * This function walks along a Trie top-down until it finds the node which
     * fully represents the term/ prefix/ word that was searched for.
     * It passes the parent node of the found Trie and its index to a callback
     * function. It passes the parent node, because otherwise Trie mutation would
     * become increasingly more difficult.
     *
     * An earlier implementation of this function used a naive recursive algorithm,
     * but my friend - @ejpbruel - has shown me that you can simply rewrite any form 
     * of tail-recursion to an inner loop.
     * 
     * @param {String}   word   the word or prefix to search for
     * @param {Trie}     trie   the root trie node to walk through
     * @param {Function} method callback function to which the results of the
     *                          walker are passed
     * @type  {mixed}
     * @memberOf Trie
     */
    function walker(word, trie, method) {
        if (!word || !trie || !method) return null;
        var ch, c, l, i, prev;
        
        while (word.length > 0) {
            ch = word.charAt(0),
            c  = trie.children,
            l  = c.length,
            i  = 0;
            for (; i < l; ++i) {
                if (ch == c[i].stem)
                    break;
            }
            if (i == l)
                return null; // not found
            word = word.substring(1),
            prev = trie,
            trie = c[i];
        }
        return method(prev, i);
    }
    
    /**
     * Sorting helper function that can be passed to Array.sort().
     * The result of this helper will be that all nodes will be sorted in 
     * ascending lexical order.
     *
     * @param {Trie} a first element for comparison
     * @param {Trie} b second element for comparison
     * @type  {Number}
     * @memberOf Trie
     */
    function sortAsc(a, b) {
        var s1 = a.nstem,
            s2 = b.nstem;
        return (s1 < s2) ? 1 : (s1 > s2) ? -1 : 0;
    }
    
    /**
     * Sorting helper function that can be passed to Array.sort().
     * The result of this helper will be that all nodes will be sorted in 
     * descending lexical order.
     *
     * @param {Trie} a first element for comparison
     * @param {Trie} b second element for comparison
     * @type  {Number}
     * @memberOf Trie
     */
    function sortDesc(a, b) {
        var s1 = a.nstem,
            s2 = b.nstem;
        return (s1 > s2) ? 1 : (s1 < s2) ? -1 : 0;
    }
    
    return Trie;
})();
