export async function checkDraftSave(page, bundle, css) {
  page.setDefaultTimeout(8000);
  await page.context().route('**/*', route => route.abort());
  const errors=[];
  page.on('pageerror', error => errors.push(error.message));
  const assert=(ok,message)=>{if(!ok)throw new Error(message);};
  let scenarios=0;
  async function mount(mode) {
    await page.goto(`about:blank${mode==='edit'?'#edit':''}`);
    await page.setContent('<main id="root" style="max-width:900px;margin:32px auto"></main>');
    await page.addStyleTag({path:css});
    await page.addScriptTag({path:bundle});
  }
  for(const mode of ['create','edit']) {
    for(const outcome of ['clear','found','unavailable','pending']) {
      await mount(mode);
      await page.getByRole('textbox',{name:'Common name',exact:true}).fill('BB-TEST C3 Synthetic Beetle');
      const save=page.getByRole('button',{name:mode==='create'?'Save uncataloged draft':'Save core changes',exact:true});
      await save.scrollIntoViewIfNeeded();
      const before=await save.boundingBox();
      const x=before.x+before.width/2, y=before.y+before.height/2;
      await page.mouse.move(x,y);
      await page.mouse.down();
      await page.getByText('Checking for possible duplicates…',{exact:true}).waitFor();
      let after=await save.boundingBox();
      assert(Math.abs(after.y-before.y)<1 && Math.abs(after.x-before.x)<1,`${mode}: blur-time duplicate checking moved Save before pointer-up`);
      if(outcome!=='pending') await page.evaluate(outcome=>{
        const result=outcome==='found'?{status:'found',duplicates:[{
          specimenId:'66666666-6666-4666-8666-666666666666',accessionNumber:null,
          commonName:'Synthetic match',scientificName:null,status:'UNCATALOGED',
          confidence:'HIGH',matchedFields:['COMMON_NAME'],differingFields:[],message:'Synthetic warning only',
        }]}:{status:outcome};
        window.draftSaveFixture.requests[0].resolve(result);
      },outcome);
      if(outcome!=='pending') await page.getByText('Checking for possible duplicates…',{exact:true}).waitFor({state:'hidden'});
      if(outcome==='clear')await page.getByText('No possible duplicates were found',{exact:false}).waitFor();
      if(outcome==='found')await page.getByText('1 existing specimen may be a duplicate.',{exact:true}).waitFor();
      if(outcome==='unavailable')await page.getByRole('button',{name:'Check again',exact:true}).waitFor();
      after=await save.boundingBox();
      assert(Math.abs(after.y-before.y)<1 && Math.abs(after.x-before.x)<1,`${mode}: settled ${outcome} response moved Save before pointer-up`);
      await page.mouse.up();
      await page.waitForFunction(()=>window.draftSaveFixture.submissions.length===1);
      const submitted=await page.evaluate(()=>window.draftSaveFixture.submissions);
      assert(submitted.length===1 && submitted[0].mode===mode,'First click did not reach exactly one save action');
      assert(submitted[0].values.commonName==='BB-TEST C3 Synthetic Beetle' && submitted[0].values.accessionNumber==='','Submission lost the typed name or blank accession');
      scenarios++;
    }
    await mount(mode);
    await page.getByRole('textbox',{name:'Common name',exact:true}).fill('BB-TEST C3 Keyboard');
    await page.getByRole('textbox',{name:'Common name',exact:true}).press('Enter');
    await page.waitForFunction(()=>window.draftSaveFixture.submissions.length===1);
    scenarios++;
  }
  assert(errors.length===0,`Runtime errors: ${errors.join('; ')}`);
  return {marker:'DRAFT_SAVE_LAYOUT_OK',scenarios};
}
