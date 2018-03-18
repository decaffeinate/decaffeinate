import {checkCS2} from './support/check';

// These tests are taken from csx.coffee in the CoffeeScript test suite.
describe('csx', () => {
  it('self closing', () => {
    checkCS2(`
      <div />
    `, `
      <div />;
    `);
  });

  it('regex attribute', () => {
    checkCS2(`
      <div x={/>asds/} />
    `, `
      <div x={/>asds/} />;
    `);
  });

  it('string attribute', () => {
    checkCS2(`
      <div x="a" />
    `, `
      <div x="a" />;
    `);
  });

  it('simple attribute', () => {
    checkCS2(`
      <div x={42} />
    `, `
      <div x={42} />;
    `);
  });

  it('assignment attribute', () => {
    checkCS2(`
      <div x={y = 42} />
    `, `
      let y;
      <div x={(y = 42)} />;
    `);
  });

  it('object attribute', () => {
    checkCS2(`
      <div x={{y: 42}} />
    `, `
      <div x={{y: 42}} />;
    `);
  });

  it('attribute without value', () => {
    checkCS2(`
      <div checked x="hello" />
    `, `
      <div checked x="hello" />;
    `);
  });

  it('paired', () => {
    checkCS2(`
      <div></div>
    `, `
      <div></div>;
    `);
  });

  it('simple content', () => {
    checkCS2(`
      <div>Hello world</div>
    `, `
      <div>Hello world</div>;
    `);
  });

  it('content interpolation', () => {
    checkCS2(`
      <div>Hello {42}</div>
    `, `
      <div>Hello {42}</div>;
    `);
  });

  it('nested tag', () => {
    checkCS2(`
      <div><span /></div>
    `, `
      <div><span /></div>;
    `);
  });

  it('tag inside interpolation formatting', () => {
    checkCS2(`
      <div>Hello {<span />}</div>
    `, `
      <div>Hello {<span />}</div>;
    `);
  });

  it('tag inside interpolation, tags are callable', () => {
    checkCS2(`
      <div>Hello {<span /> x}</div>
    `, `
      <div>Hello {(<span />)(x)}</div>;
    `);
  });

  it('tags inside interpolation, tags trigger implicit calls', () => {
    checkCS2(`
      <div>Hello {f <span />}</div>
    `, `
      <div>Hello {f(<span />)}</div>;
    `);
  });

  it('regex in interpolation', () => {
    checkCS2(`
      <div x={/>asds/}><div />{/>asdsad</}</div>
    `, `
      <div x={/>asds/}><div />{/>asdsad</}</div>;
    `);
  });

  it('interpolation in string attribute value', () => {
    checkCS2(`
      <div x="Hello #{world}" />
    `, `
      <div x={\`Hello \${world}\`} />;
    `);
  });

  it('complex interpolation in string attribute value', () => {
    checkCS2(`
      <div x="Hello #{a b}" />
    `, `
      <div x={\`Hello \${a(b)}\`} />;
    `);
  });

  it('complex interpolation in string attribute value in braces', () => {
    checkCS2(`
      <div x={"Hello #{a b}"} />
    `, `
      <div x={\`Hello \${a(b)}\`} />;
    `);
  });

  it('complex interpolation in herestring attribute value', () => {
    checkCS2(`
      <div x="""Hello #{a b}""" />
    `, `
      <div x={\`Hello \${a(b)}\`} />;
    `);
  });

  it('ambiguous tag', () => {
    checkCS2(`
      a <b > c </b>
    `, `
      a(<b > c </b>);
    `);
  });

  it('escaped CoffeeScript attribute', () => {
    checkCS2(`
      <Person name={if test() then 'yes' else 'no'} />
    `, `
      <Person name={test() ? 'yes' : 'no'} />;
    `);
  });

  it('escaped CoffeeScript attribute over multiple lines', () => {
    checkCS2(`
      <Person name={
        if test()
          'yes'
        else
          'no'
      } />
    `, `
      <Person name={
        test() ?
          'yes'
        :
          'no'
      } />;
    `);
  });

  it('multiple line escaped CoffeeScript with nested CSX', () => {
    checkCS2(`
      <Person name={
        if test()
          'yes'
        else
          'no'
      }>
      {
  
        for n in a
          <div> a
            asf
            <li xy={"as"}>{ n+1 }<a /> <a /> </li>
          </div>
      }
  
      </Person>
    `, `
      <Person name={
        test() ?
          'yes'
        :
          'no'
      }>
      {
      
        Array.from(a).map((n) =>
          <div> a
            asf
            <li xy={"as"}>{ n+1 }<a /> <a /> </li>
          </div>)
      }
      
      </Person>;
    `);
  });

  it('nested CSX within an attribute, with object attr value', () => {
    checkCS2(`
      <Company>
        <Person name={<NameComponent attr3={ {'a': {}, b: '{'} } />} />
      </Company>
    `, `
      <Company>
        <Person name={<NameComponent attr3={ {'a': {}, b: '{'} } />} />
      </Company>;
    `);
  });

  it('complex nesting', () => {
    checkCS2(`
      <div code={someFunc({a:{b:{}, C:'}{}{'}})} />
    `, `
      <div code={someFunc({a:{b:{}, C:'}{}{'}})} />;
    `);
  });

  it('multiline tag with nested CSX within an attribute', () => {
    checkCS2(`
      <Person
        name={
          name = formatName(user.name)
          <NameComponent name={name.toUppercase()} />
        }
      >
        blah blah blah
      </Person>
    `, `
      let name;
      <Person
        name={
          (name = formatName(user.name)),
          <NameComponent name={name.toUppercase()} />
        }
      >
        blah blah blah
      </Person>;
    `);
  });

  it('escaped CoffeeScript with nested object literals', () => {
    checkCS2(`
      <Person>
        blah blah blah {
          {'a' : {}, 'asd': 'asd'}
        }
      </Person>
    `, `
      <Person>
        blah blah blah {
          {'a' : {}, 'asd': 'asd'}
        }
      </Person>;
    `);
  });

  it('multiline tag attributes with escaped CoffeeScript', () => {
    checkCS2(`
      <Person name={if isActive() then 'active' else 'inactive'}
      someattr='on new line' />
    `, `
      <Person name={isActive() ? 'active' : 'inactive'}
      someattr='on new line' />;
    `);
  });

  it('lots of attributes', () => {
    checkCS2(`
      <Person eyes={2} friends={getFriends()} popular = "yes"
      active={ if isActive() then 'active' else 'inactive' } data-attr='works' checked check={me_out}
      />
    `, `
      <Person eyes={2} friends={getFriends()} popular = "yes"
      active={ isActive() ? 'active' : 'inactive' } data-attr='works' checked check={me_out}
      />;
    `);
  });

  it('complex regex', () => {
    checkCS2(`
      <Person />
      /\\/\\/<Person \\/>\\>\\//
    `, `
      <Person />;
      /\\/\\/<Person \\/>\\>\\//;
    `);
  });

  it('heregex', () => {
    checkCS2(`
      test = /432/gm # this is a regex
      6 /432/gm # this is division
      <Tag>
      {test = /<Tag>/} this is a regex containing something which looks like a tag
      </Tag>
      <Person />
      REGEX = /// ^
        (/ (?! [\\s=] )   # comment comment <comment>comment</comment>
        [^ [ / \\n \\\\ ]*  # comment comment
        (?:
          <Tag />
          (?: \\\\[\\s\\S]   # comment comment
            | \\[         # comment comment
                 [^ \\] \\n \\\\ ]*
                 (?: \\\\[\\s\\S] [^ \\] \\n \\\\ ]* )*
                 <Tag>tag</Tag>
               ]
          ) [^ [ / \\n \\\\ ]*
        )*
        /) ([imgy]{0,4}) (?!\\w)
      ///
      <Person />
    `, `
      let test = /432/gm; // this is a regex
      6 /432/gm; // this is division
      <Tag>
      {(test = /<Tag>/)} this is a regex containing something which looks like a tag
      </Tag>;
      <Person />;
      const REGEX = new RegExp(\`^\\
      (/(?![\\\\s=])\\
      [^[/\\\\n\\\\\\\\]*\\
      (?:\\
      <Tag/>\\
      (?:\\\\\\\\[\\\\s\\\\S]\\
      |\\\\[\\
      [^\\\\]\\\\n\\\\\\\\]*\\
      (?:\\\\\\\\[\\\\s\\\\S][^\\\\]\\\\n\\\\\\\\]*)*\\
      <Tag>tag</Tag>\\
      ]\\
      )[^[/\\\\n\\\\\\\\]*\\
      )*\\
      /)([imgy]{0,4})(?!\\\\w)\\
      \`);
      <Person />;
    `);
  });

  it('comment within CSX is not treated as comment', () => {
    checkCS2(`
      <Person>
      # i am not a comment
      </Person>
    `, `
      <Person>
      # i am not a comment
      </Person>;
    `);
  });

  it('comment at start of CSX escape', () => {
    checkCS2(`
      <Person>
      {# i am a comment
        "i am a string"
      }
      </Person>
    `, `
      <Person>
      {// i am a comment
        "i am a string"
      }
      </Person>;
    `);
  });

  it('comment at end of CSX escape', () => {
    checkCS2(`
      <Person>
      {"i am a string"
      # i am a comment
      }
      </Person>
    `, `
      <Person>
      {"i am a string"
      // i am a comment
      }
      </Person>;
    `);
  });

  it('string within CSX is ignored', () => {
    checkCS2(`
      <Person> "i am not a string" 'nor am i' </Person>
    `, `
      <Person> "i am not a string" 'nor am i' </Person>;
    `);
  });

  it('special chars within CSX are ignored', () => {
    checkCS2(`
      <Person> a,/';][' a\\''@$%^&˚¬∑˜˚∆å∂¬˚*()*&^%$>> '"''"'''\\'\\'m' i </Person>
    `, `
      <Person> a,/';][' a\\''@$%^&˚¬∑˜˚∆å∂¬˚*()*&^%$>> '"''"'''\\'\\'m' i </Person>;
    `);
  });

  it('html entities (name, decimal, hex) within CSX', () => {
    checkCS2(`
      <Person>  &&&&euro;  &#8364; &#x20AC;;; </Person>
    `, `
      <Person>  &&&&euro;  &#8364; &#x20AC;;; </Person>;
    `);
  });

  it('tag with {{}}', () => {
    checkCS2(`
      <Person name={{value: item, key, item}} />
    `, `
      <Person name={{value: item, key, item}} />;
    `);
  });

  it('tag with namespace', () => {
    checkCS2(`
      <Something.Tag></Something.Tag>
    `, `
      <Something.Tag></Something.Tag>;
    `);
  });

  it('tag with lowercase namespace', () => {
    checkCS2(`
      <something.tag></something.tag>
    `, `
      <something.tag></something.tag>;
    `);
  });

  it('self closing tag with namespace', () => {
    checkCS2(`
      <Something.Tag />
    `, `
      <Something.Tag />;
    `);
  });

  it('self closing tag with spread attribute', () => {
    checkCS2(`
      <Component a={b} {x...} b="c" />
    `, `
      <Component a={b} {...x} b="c" />;
    `);
  });

  it('complex spread attribute', () => {
    checkCS2(`
      <Component {x...} a={b} {x...} b="c" {$my_xtraCoolVar123...} />
    `, `
      <Component {...x} a={b} {...x} b="c" {...$my_xtraCoolVar123} />;
    `);
  });

  it('multiline spread attribute', () => {
    checkCS2(`
      <Component {
        x...} a={b} {x...} b="c" {z...}>
      </Component>
    `, `
      <Component {
        ...x} a={b} {...x} b="c" {...z}>
      </Component>;
    `);
  });

  it('multiline tag with spread attribute', () => {
    checkCS2(`
      <Component
        z="1"
        {x...}
        a={b}
        b="c"
      >
      </Component>
    `, `
      <Component
        z="1"
        {...x}
        a={b}
        b="c"
      >
      </Component>;
    `);
  });

  it('multiline tag with spread attribute first', () => {
    checkCS2(`
      <Component
        {x...}
        z="1"
        a={b}
        b="c"
      >
      </Component>
    `, `
      <Component
        {...x}
        z="1"
        a={b}
        b="c"
      >
      </Component>;
    `);
  });

  it('complex multiline spread attribute', () => {
    checkCS2(`
      <Component
        {y...
        } a={b} {x...} b="c" {z...}>
        <div code={someFunc({a:{b:{}, C:'}'}})} />
      </Component>
    `, `
      <Component
        {...y
        } a={b} {...x} b="c" {...z}>
        <div code={someFunc({a:{b:{}, C:'}'}})} />
      </Component>;
    `);
  });

  it('self closing spread attribute on single line', () => {
    checkCS2(`
      <Component a="b" c="d" {@props...} />
    `, `
      <Component a="b" c="d" {...this.props} />;
    `);
  });

  it('self closing spread attribute on new line', () => {
    checkCS2(`
      <Component
        a="b"
        c="d"
        {@props...}
      />
    `, `
      <Component
        a="b"
        c="d"
        {...this.props}
      />;
    `);
  });

  it('self closing spread attribute on same line', () => {
    checkCS2(`
      <Component
        a="b"
        c="d"
        {@props...} />
    `, `
      <Component
        a="b"
        c="d"
        {...this.props} />;
    `);
  });

  it('self closing spread attribute on next line', () => {
    checkCS2(`
      <Component
        a="b"
        c="d"
        {@props...}
  
      />
    `, `
      <Component
        a="b"
        c="d"
        {...this.props}
      
      />;
    `);
  });

  it('empty strings are not converted to true', () => {
    checkCS2(`
      <Component val="" />
    `, `
      <Component val="" />;
    `);
  });

  it('hyphens in tag names', () => {
    checkCS2(`
      <paper-button className="button">{text}</paper-button>
    `, `
      <paper-button className="button">{text}</paper-button>;
    `);
  });

  it('tag inside CSX works following: identifier', () => {
    checkCS2(`
      <span>a<div /></span>
    `, `
      <span>a<div /></span>;
    `);
  });

  it('tag inside CSX works following: number', () => {
    checkCS2(`
      <span>3<div /></span>
    `, `
      <span>3<div /></span>;
    `);
  });

  it('tag inside CSX works following: paren', () => {
    checkCS2(`
      <span>(3)<div /></span>
    `, `
      <span>(3)<div /></span>;
    `);
  });

  it('tag inside CSX works following: square bracket', () => {
    checkCS2(`
      <span>]<div /></span>
    `, `
      <span>]<div /></span>;
    `);
  });

  it('unspaced less than inside CSX works but is not encouraged', () => {
    checkCS2(`
      a = 3
      div = 5
      html = <span>{a<div}</span>
    `, `
      const a = 3;
      const div = 5;
      const html = <span>{a<div}</span>;
    `);
  });

  it('unspaced less than before CSX works but is not encouraged', () => {
    checkCS2(`
      div = 5
      res = 2<div
      html = <span />
    `, `
      const div = 5;
      const res = 2<div;
      const html = <span />;
    `);
  });

  it('unspaced less than after CSX works but is not encouraged', () => {
    checkCS2(`
      div = 5
      html = <span />
      res = 2<div
    `, `
      const div = 5;
      const html = <span />;
      const res = 2<div;
    `);
  });

  it('comments inside interpolations that also contain CSX tags', () => {
    checkCS2(`
      <div>
        {
          # comment
          <div />
        }
      </div>
    `, `
      <div>
        {
          // comment
          <div />
        }
      </div>;
    `);
  });

  it('comments inside interpolations that also contain CSX attributes', () => {
    checkCS2(`
      <div>
        <div anAttr={
          # comment
          "value"
        } />
      </div>
    `, `
      <div>
        <div anAttr={
          // comment
          "value"
        } />
      </div>;
    `);
  });

  it('JSX fragments: empty fragment', () => {
    checkCS2(`
      <></>
    `, `
      <></>;
    `);
  });

  it('JSX fragments: fragment with text nodes', () => {
    checkCS2(`
      <>
        Some text.
        <h2>A heading</h2>
        More text.
        <h2>Another heading</h2>
        Even more text.
      </>
    `, `
      <>
        Some text.
        <h2>A heading</h2>
        More text.
        <h2>Another heading</h2>
        Even more text.
      </>;
    `);
  });

  it('JSX fragments: fragment with component nodes', () => {
    checkCS2(`
     Component = (props) =>
       <Fragment>
         <OtherComponent />
         <OtherComponent />
       </Fragment>
    `, `
      const Component = props => {
        return <Fragment>
          <OtherComponent />
          <OtherComponent />
        </Fragment>;
      };
    `);
  });
});
