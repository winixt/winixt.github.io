var isMatch = function(s, p) {
    const reg = new RegExp('^' + p.replace(/\?/g, '\\w{1}').replace(/\*+/g, '.*') + '$');
    console.log(reg);
    // return reg.test(s);
};

const data1 = [1,2,87,87,87,2,1];
const data2 = [3,4,5,1,2]


const str1 = 'abbabaaabbabbaababbabbbbbabbbabbbabaaaaababababbbabababaabbababaabbbbbbaaaabababbbaabbbbaabbbbababababbaabbaababaabbbababababbbbaaabbbbbabaaaabbababbbbaababaabbababbbbbababbbabaaaaaaaabbbbbaabaaababaaaabb';
const str2 = '**aa*****ba*a*bb**aa*ab****a*aaaaaa***a*aaaa**bbabb*b*b**aaaaaaaaa*a********ba*bbb***a*ba*bb*bb**a*b*bb';


console.log(isMatch(str1, str2));